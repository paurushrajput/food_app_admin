"use strict";
// Create a custom middleware for image upload4
const {uploadFile} = require("./s3")
const streamToBuffer = require("./buffer")
const { ImageFileTypes } = require("../constants/database")
const ClientError = require("../error/clientError");

async function handleImageUpload(request, reply) {
    // try {  
      const data = await request.file()
  data.file // stream
  data.fields // other parsed parts
  data.fieldname
  data.filename
  data.encoding
  data.mimetype

  if(!Object.values(ImageFileTypes).includes(data.mimetype)){
    throw new ClientError("Please select valid image format");
  }
  const buffer = await streamToBuffer(data.file);
const uploadResut = await uploadFile(buffer , data.filename);
      // Store the uploaded image information in the request object for use in the route handler
     // request.uploadedImages = uploadResut
     return uploadResut;
    // } catch (error) {
    //   console.error('Error handling image upload:', error);
    //   reply.status(500).send({ success: false, message: error?.message || 'Image upload failed' });
    // }
  }
  
  module.exports = handleImageUpload;
  