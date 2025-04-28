const DinningsModel = require("../../models/mysql/dinnings.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const { Pagination, Status } = require("../../constants/database");
const ClientError = require("../../error/clientError");
const {checkMandatoryFields, isEmptyField, getTrimmedValue} = require("../../utils/common.js");

class DinningsService {
  /**
  * list reviews and overall rating of restaurant
  * @param {string} body - res_id, pagination values.
  */
  static async getDinningsList(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      user,
      from_date,
      to_date,
      dinning_id
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

    const response = await DinningsModel.listDinnings({
      sort, 
      offset, 
      limit, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      dinning_id
    })

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
  }

  static async addDinning(body){
    const {name, status} = body;

    const obj = {
      name: name,
    };
  
    const {rows}=  await DinningsModel.insert(obj);
    if (rows != 1) {
      throw new GeneralError('An error occurred while creating account. Please try again.');
    }
    
    return {
      msg: "Dinning added successfully"
    }; 
  }

  static async updateDinning(body) {
    let { id, name, status } = body;

    const [dinning] = await DinningsModel.getDinningsByColumn({ column : "uid", value : [id] });

    if(!dinning)
      throw new ClientError("Dinning not found");

    let updateObj = {};

    if(!isEmptyField(status)){
      updateObj.status = status
    }
    if(!isEmptyField(name)){
      updateObj.name = name
    }

    await DinningsModel.updateOneById(updateObj, dinning.id)

    return {
      msg: "Dinning updated successfully"
    };
  }
}


module.exports = DinningsService;