const CountriesModel = require("../../models/mysql/countries.model");
const StatesModel = require("../../models/mysql/states.model");
const CitiesModel = require("../../models/mysql/cities.model");
const LocationModel = require("../../models/mysql/location.model");
const MediaModel = require("../../models/mysql/media.model");
const handleImageUpload = require("./media.service");
const {uploadFile, deleteFile,getUrlFromBucket} = require("../../utils/s3");
const ClientError = require("../../error/clientError");
const {isEmptyField, getTrimmedValue} = require("../../utils/common");
const { Pagination, Status, Bit } = require("../../constants/database");

class LocationService {
  static async updateCountryStatus(body) {
    let { id, status } = body;
    const response = CountriesModel.updateOneById({ status }, id)
    return response;
  }

  static async updateStateStatus(body) {
    let { id, status } = body;
    const response = StatesModel.updateOneById({ status }, id)
    return response;
  }

  static async updateCityStatus(body) {
    let { id, status } = body;
    const response = CitiesModel.updateOneById({ status }, id);
    return response;
  }

  /**
  * list all locations and list city by id
  * @param {string} body -location Body
  */
  static async getLocationList(body){
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
      city_id,
      country_id,
      status
    } = body;

    if(isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if(isEmptyField(order)) order = Pagination.defaultOrder;
    if(isEmptyField(page)) page = Pagination.defaultPage;
    if(isEmptyField(page_size)) page_size = Pagination.pageSize;
    if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;
    
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await LocationModel.listLocations({
      sort, 
      offset, 
      limit, 
      is_paginated,
      keyword, 
      from_date, 
      to_date, 
      city_id,
      country_id,
      status 
    });

    return {
      count: response.count,
      rows: response.rows?.map(each=>({
        ...each,
        icon: getUrlFromBucket(each.icon)
      }))
    };
  }

  static async insertLocation(body){
    const {status, operational, name, city_id, country_id, icon, user} = body;

    const [location] = await LocationModel.getLocationByColumn({
      column: "name",
      value: name,
    });

    if (location) {
      throw new ClientError('Location already exist with same name');
    }

    let getMediaId
    if(!isEmptyField(icon)){
      [getMediaId] = await MediaModel.getOneByuId(icon);

      if(!getMediaId)
        throw new ClientError("image not found in media");
    }

    if(isEmptyField(operational)){
      operational = Bit.one
    }

    const [country] = await CountriesModel.getCountryByColumn({
      column: "id",
      value: country_id,
    });

    if (!country) {
      throw new ClientError('Country not found');
    }

    const [city] = await CitiesModel.getOneByColumns({
      columns: ["id", "country_id"],
      values: [city_id, country?.id],
    });

    if (!city) {
      throw new ClientError('City not found');
    }

    const obj = {
      status: status,
      name: name,
      operational: operational,
      city_id: city.id,
      country_id: country?.id,
      created_by: user,
      icon: getMediaId?.id
    };

    const {rows}=  await LocationModel.insertLocation(obj);
    if (rows != 1) {
      throw new GeneralError('An error occurred while creating account. Please try again.');
    }
    return rows; 
  }

 /**
 * list all locations and list city by id
  * @param {string} body -location Body
 */
 static async updateLocation(body){
  let {uid,status , name , icon , city_id , country_id, operational} = body;
  const getLocationId = await LocationModel.getOneByuId(uid);
  const id = getLocationId[0].id
  let updateObj = {};
  if(!isEmptyField(status)){
    updateObj.status = status
  }
  if(!isEmptyField(name)){
    updateObj.name = name
  }
  if(!isEmptyField(icon)){
    const [getMediaId] = await MediaModel.getOneByuId(icon);
    if(!getMediaId)
      throw new ClientError("icon not found");
    updateObj.icon = getMediaId.id
  }
  if(!isEmptyField(city_id)){
    updateObj.city_id = city_id
  }
  if(!isEmptyField(country_id)){
    updateObj.country_id = country_id
  }
  if(!isEmptyField(operational)){
    updateObj.operational = operational
  }
  const response = LocationModel.updateOneById(updateObj , id);
  return response;
 }

  /**
  * list all cities by country id
  * @param {string} body -location Body
  */
  static async getCitiesListbyCountryId(body) {
    let {
      country_id,
      city_id,
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
    } = body;

    if(isEmptyField(sort_by)) sort_by = 'created_at';
    if(isEmptyField(order)) order = 'desc';
    if(isEmptyField(page)) page = 1;
    if(isEmptyField(page_size)) page_size = 10;
    if(isEmptyField(is_paginated)) is_paginated = true;
    
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);
  
    const response = await CitiesModel.getCitiesByCountryId({
      country_id,
      city_id,
      offset,
      limit,
      is_paginated,
      sort,
      keyword,
      from_date,
      to_date
    });
  
    return {
      count: response.count,
      rows: response.rows
    };
  }

  /**
  * list all countries 
  * @param {string} body - Body
  */
   static async getAllCountries(body){
    let {
      country_id,
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
    } = body;

    if(isEmptyField(sort_by)) sort_by = 'created_at';
    if(isEmptyField(order)) order = 'desc';
    if(isEmptyField(page)) page = 1;
    if(isEmptyField(page_size)) page_size = 10;
    if(isEmptyField(is_paginated)) is_paginated = true;
    
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await CountriesModel.listCountries({
      country_id,
      offset,
      limit,
      is_paginated,
      sort,
      keyword,
      from_date,
      to_date
    });
    return response.rows;
  }
}


module.exports = LocationService;