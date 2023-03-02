const uploadFile = require("../aws/aws");
const productModel = require("../models/productModel");
const { isValidBody, isValidImg, validValue, validObjectId } = require("../validator/validation");

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<CREATE_PRODUCT>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const createproduct = async function (req, res) {
  try {
    let data = req.body;
    let file = req.files;

    if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "Please give some data" }); }
    let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data;

    //.......................Mandatory Part.................................
    if (!title) { return res.status(400).send({ status: false, message: "Title is mandatory" }); }
    if (!description) { return res.status(400).send({ status: false, message: "description is mandatory" }); }
    if (!price) { return res.status(400).send({ status: false, message: "Price is mandatory" }); }
    if (!currencyId) { return res.status(400).send({ status: false, message: "currencyId is mandatory" }); }
    if (!currencyFormat) { return res.status(400).send({ status: false, message: "currencyFormat is mandatory" }); }


    //..............................title..........................
    if (title) {
      data.title = data.title.toLowerCase()
      if (!validValue(title)) { return res.status(400).send({ status: false, message: "Title should be in String Format" }); }
      let findtitle = await productModel.findOne({ title: data.title });
      if (findtitle) { return res.status(400).send({ status: false, message: " this title already exists" }); }
    }

    //................................description.......................
    if (!validValue(description)) { return res.status(400).send({ status: false, message: "description should be in String Format" }); }

    //...............................Price.................................
    if (!/^[0-9]*$/.test(price)) {
      return res.status(400).send({ status: false, message: "Price should be in Number" });
    }

    //...........................CurrencyId.................................
    if (currencyId != "INR") {
      return res.status(400).send({ status: false, message: "Only 'INR' CurrencyId is allowed" });
    }

    //...........................CurrencyFormat.................................
    if (currencyFormat && currencyFormat != "₹") {
      return res.status(400).send({ status: false, message: "Only '₹' Currency Symbol is allowed" });
    }

    //.............................isFreeShipping..............................
    if (isFreeShipping) {
      if (isFreeShipping != "true" && isFreeShipping != "false") {
        return res.status(400).send({ status: false, message: "isFreeShipping is only accepted in Boolean Value like true or false" });
      }
    }

    //...........................ProductImage...............................
    if (file && file.length == 0) { return res.status(400).send({ status: false, message: "productImage is a mandatory" }); }
    if (file && file.length > 0) {
      if (!isValidImg(file[0].originalname)) { return res.status(400).send({ status: false, message: "Please provide image in jpg|gif|png|jpeg|jfif " }); }
    }
    let url = await uploadFile(file[0]);
    data.productImage = url

    //.................................Style.............................
    if (style) {
      if (!validValue(style)) { return res.status(400).send({ status: false, message: "style should be in String format" }); }
    }

    //..............................AvailableSize.........................
    if (!availableSizes) { return res.status(400).send({ status: false, message: "availableSizes is mandatory" }); }

    size = availableSizes.replace(/\s+/g, "").split(",")
    let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
    let present
    for (let i = 0; i < size.length; i++) {
      present = arr.includes(size[i])
    }
    if (!present) {
      return res.status(400).send({ status: false, message: "Enter a valid size S or XS or M or X or L or XXL or XL " });
    }
    data['availableSizes'] = size

    //................................Installments..........................
    if (installments) {
      if (!/^[0-9]*$/.test(installments)) {
        return res.status(400).send({ status: false, message: "installments should be in Number" });
      }
    }

    let createdproduct = await productModel.create(data)
    return res.status(201).send({ status: true, message: "Success", data: createdproduct })

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}



//.......................................GET_BY_QUERY...................................................
const getProductBYQuery = async (req, res) => {
  try {

    const data = req.query

    let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;
    const filterQuery = { isDeleted: false }

    if (size) {
      size = size.toUpperCase()
      size = size.replace(/\s+/g, "").split(",")
      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
      let present
      for (let i = 0; i < size.length; i++) {
        present = arr.includes(size[i])
      }

      if (!present) {
        return res.status(400).send({ status: false, message: "Enter a valid size S or XS or M or X or L or XXL or XL", });
      }
      filterQuery.availableSizes = { $in: size }
    }

    if (name) {
      data.name = data.name.toLowerCase()

      if (!validValue(name)) {
        return res.status(400).send({ status: false, message: "name is only in String Format" })
      }
      filterQuery.title = { $regex: name }
    }

    if (priceGreaterThan) {
      if (!/^[0-9]*$/.test(priceGreaterThan)) {
        return res.status(400).send({ status: false, message: "priceGreaterThan should be in Number" });
      }
      filterQuery.price = { $gt: priceGreaterThan }
    }

    if (priceLessThan) {
      if (!/^[0-9]*$/.test(priceLessThan)) { return res.status(400).send({ status: false, message: "priceLessThan should be in Number" });}
      filterQuery.price = { $lt: priceLessThan }
    }

    if (priceSort) {
      if (priceSort != 1 && priceSort != - 1) { return res.status(400).send({ status: false, message: "If you want to use PriceSort use 1 for ascending or  -1 for descending order" });}
    }

    const productData = await productModel.find(filterQuery).sort({ price: priceSort })
    if (productData.length == 0) return res.status(404).send({ status: false, message: "No product found" });

    return res.status(200).send({ status: true, message: "Success", data: productData })

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

//.........................................GET_BY_PARAMS.................................................

const getProduct = async (req, res) => {
  try {
    const productId = req.params.productId
    if (!validObjectId(productId)) { return res.status(400).send({ status: false, message: "Please Provide Valid Product Id" })}

    const productData = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!productData) { return res.status(404).send({ status: false, message: "Product Data not Found" })}

    return res.status(200).send({ status: true, message: 'Success', data: productData });
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

//--------------------------------------[ UPDATE PROduct ]---------------------------------------------//

const updateProduct = async function (req, res) {
  try {
    const productId = req.params.productId
    if (!validObjectId(productId)) { return res.status(400).send({ status: false, message: "Please Provide Valid Product Id" })}

    const findProductId = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!findProductId) { return res.status(404).send({ status: false, message: "Product not found" })}

    const data = req.body;
    const file = req.files

    if (!isValidBody(data) && (typeof (file) == "undefined")) { return res.status(400).send({ status: false, message: "Please give some data" }); }

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = data;
    
    const Updateobj = {}

    if (title) {
      data.title = data.title.toLowerCase()
      if (!validValue(title)) { return res.status(400).send({ status: false, message: "Title should be in String format" }); }
      let findtitle = await productModel.findOne({ title: data.title });
      if (findtitle) { return res.status(400).send({ status: false, message: " this title already exists" }); }
      Updateobj.title = title
    }

    if (description) {
      if (!validValue(description)) { return res.status(400).send({ status: false, message: "description should be in String format" }); }
      Updateobj.description = description
    }

    if (price) {
      if (!/^[0-9]*$/.test(price)) { return res.status(400).send({ status: false, message: "Price should be in Number" });}
      Updateobj.price = price
    }

    if (currencyId) {
      if (currencyId != "INR") { return res.status(400).send({ status: false, message: "Only 'INR' CurrencyId is allowed" });}
      Updateobj.currencyId = currencyId
    }

    if (currencyFormat) {
      if (currencyFormat != "₹") { return res.status(400).send({ status: false, message: "Only '₹' Currency Symbol is allowed" });}
      Updateobj.currencyFormat = currencyFormat
    }

    if (isFreeShipping) {
      if (isFreeShipping != "true" && isFreeShipping != "false") {
        return res.status(400).send({ status: false, message: "isFreeShipping is only accepted in Boolean Value like true or false" });
      }
      Updateobj.isFreeShipping = isFreeShipping
    }

      //...........Upload Image...........
    if (file && file.length > 0) {
      if (!isValidImg(file[0].originalname)) { return res.status(400).send({ status: false, message: "Please provide image in jpg|gif|png|jpeg|jfif " }); }
      let url = await uploadFile(file[0]);
      Updateobj.productImage = url
    }

    if (style) {
      if (!validValue(style)) { return res.status(400).send({ status: false, message: "style should be in String format" }); }
      Updateobj.style = style
    }

    if (availableSizes) {
      size = availableSizes.replace(/\s+/g, "").split(",")
      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
      let present
      for (let i = 0; i < size.length; i++) {
        present = arr.includes(size[i])
      }
      if (!present) {
        return res.status(400).send({ status: false, message: "Enter a valid size S or XS or M or X or L or XXL or XL ", });
      }
      
      Updateobj['availableSizes'] = size
    }

    if (installments) {
      if (!/^[0-9]*$/.test(installments)) { return res.status(400).send({ status: false, message: "installments should be in Number" });}
      Updateobj.installments = installments
    }

    const productdata = await productModel.findOneAndUpdate({ _id: productId }, { $set: Updateobj }, { new: true });

    return res.status(200).send({ status: true, message: "Success", data: productdata });
  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}

//------ Delete product ---------------
const deleteproduct = async function (req, res) {
  try {
    let productId = req.params.productId
    if (!validObjectId(productId)) { return res.status(400).send({ status: false, message: 'productId is a not a valid productId' }) }
    
    let productdata = await productModel.findOne({_id:productId,isDeleted:false})
    if (!productdata) { return res.status(404).send({ status: false, message: "Product not Found" }) }
    
    await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
    return res.status(200).send({ status: true, message: "product is sucessfully deleted" })
  }
  catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}


module.exports = { getProduct, getProductBYQuery, createproduct, updateProduct, deleteproduct }




