const CountriesModel = require("../../models/mysql/countries.model");
const StatesModel = require("../../models/mysql/states.model");
const CitiesModel = require("../../models/mysql/cities.model");
const UsersModel = require("../../models/mysql/users.model");
const { getReverseGeoCode } = require("../../utils/geolocation");
const { updateVariablesInToken } = require("../../utils/userToken");
const { RESTAURANT_SERVE_TYPE } = require("../../constants/variables");
const ClientError = require("../../error/clientError");
const RestaurantModel = require("../../models/mysql/restaurants.model");
const LocationModel = require("../../models/mysql/location.model");

class LocationService {
  /**
  * list countries(by defalut of United Arab Emirates)
  * @param {string} body - pagination values.
  */
  static async getCountryList(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword
    } = body;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await CountriesModel.listCountries({ sort, offset, limit, keyword, is_paginated })

    return {
      count: response.count,
      rows: response.rows
    };
  }

  /**
  * list states by country(by defalut of United Arab Emirates)
  * @param {string} body - pagination values.
  */
  static async getStateList(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      country_id,
      keyword
    } = body;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    if (!country_id || country_id === "" || country_id === ":country_id") {
      country_id = 231;
    }

    const response = await StatesModel.listStates({ country_id, sort, offset, limit, keyword, is_paginated })
    return {
      count: response.count,
      rows: response.rows
    };
  }

  /**
  * list cities by country(by defalut of United Arab Emirates)
  * @param {string} body - pagination values.
  */
  static async getCitiesByCountry(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      country_id
    } = body;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    if (!country_id || country_id === "" || country_id === ":country_id") {
      country_id = 231;
    }

    const response = await CitiesModel.listCities({ country_id, sort, offset, limit, keyword, is_paginated })

    return {
      count: response.count,
      rows: response.rows
    };
    // throw new GeneralError(error);
  }

  /**
  * update/add user location(city,country, lat,long)
  * @param {string} body - lat, lng, city_id, user.
  */
  static async updateUserLocation(body) {
    let { lat, lng, city_id, user } = body;

    let result;
    if(city_id && city_id !== ""){
      let [city] = await CitiesModel.getCityByColumn({column: 'uid', value: city_id});
      let [country] = await CountriesModel.getCountryByColumn({column: 'id', value: city?.country_id})

      result = await UsersModel.updateOneById({ 
        home_city_id: city?.id,
        home_country_id: country?.id
      }, user.id);

      await updateVariablesInToken({
        uid: user.uid,
        home_city_id: city?.id,
        home_country_id: country?.id
      });

    } else {
      const locationData = await getReverseGeoCode(lat, lng);
      let countryAddress = {};
      let cityAddress = {};
      countryAddress = locationData?.data?.results.find(el => el.types.includes("country"));
      cityAddress = locationData?.data?.results.find(el => el.types.includes("locality"));
      if (!cityAddress) {
        cityAddress = locationData?.data?.results.find(el => el.types.includes("sublocality"));
      }

      let cityNameObj = cityAddress.address_components.find(el => el.types.includes("locality")) || cityAddress.address_components.find(el => el.types.includes("sublocality"))
      let cityName = cityNameObj?.long_name || '';
      let countryCode = countryAddress.address_components.find(el => el.types.includes("country")).short_name || '';

      let [country] = await CountriesModel.getCountryByColumn({ column: 'code', value: countryCode })
      let [city] = await CitiesModel.getCityByNameAndCountry({ name: cityName, country_id: country?.id })

      result = await UsersModel.updateUserLocation({
        home_city_id: city?.id,
        home_country_id: country?.id,
        lat, lng, id: user.id
      });

      await updateVariablesInToken({
        uid: user.uid,
        home_city_id: city?.id,
        home_country_id: country?.id,
        lat, lng
      });
    }

    return null;
  }

  /**
 * to fetch restaurants basic details 
 * @param {string} query - location_id
 */
  static async getRestaurantsByLocation(data) {
    const { location_id } = data;

    const locations = await LocationModel.checkLocationId(location_id);
    if (Number(locations[0].location_count) < 1) {
      throw new ClientError('Invalid location_id')
    }

    const restaurants = await LocationModel.findActiveRestaurantByLocations(location_id);
    const location = restaurants[0]

    const result = {
      locations: {
        ...{
          ...location,
          restaurants: location?.restaurants?.map(restaurant => ({
            ...restaurant,
            distance: '5km',//FIXME
            time: '15min'//FIXME
          }))
        },
      } || {}
    }
    return result;
  }

  /**
 * to fetch restaurants all details
 * @param {string} query - location_id, restaurant_id
 */
  static async getRestaurantsByLocationAndRestaurant(data) {
    const { location_id, restaurant_id } = data;

    const locationsExists = await LocationModel.checkLocationId(location_id);
    if (Number(locationsExists[0].location_count) < 1) {
      throw new ClientError('Invalid location_id')
    }

    const restaurantsExists = await RestaurantModel.checkLocationId(restaurant_id);
    if (Number(restaurantsExists[0].restaurant_count) < 1) {
      throw new ClientError('Invalid restaurant_id')
    }

    const restaurants = await LocationModel.findActiveRestaurantByLocationsWithAllDetails(location_id, restaurant_id);
    const location = restaurants[0]

    const result = {
      locations: {
        ...{
          ...location,
          restaurant: {
            ...location?.restaurant,
            serveType: RESTAURANT_SERVE_TYPE,//FIXME: static value is used
            distance: '5km',//FIXME
            time: '15min'//FIXME
          }
        },
      } || {}
    }
    return result;
  }
}


module.exports = LocationService;