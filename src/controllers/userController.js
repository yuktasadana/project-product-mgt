const uploadFile = require("../aws/aws");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { validPhone, validEmail, validValue, isValidImg, validName, validPincode, validObjectId, validPassword, isValidBody } = require("../validator/validation");

//-------------------------------------[ CREATE USER ]---------------------------------------//

const createUser = async function (req, res) {
  try {
    let data = req.body;
    let file = req.files;

    if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "Please give some data" }); }

    let { fname, lname, email, phone, password, address } = data;

    if (!fname) { return res.status(400).send({ status: false, message: "FirstName is mandatory" }); }
    if (!lname) { return res.status(400).send({ status: false, message: "lastName is mandatory" }); }
    if (!email) { return res.status(400).send({ status: false, message: "Email is mandatory" }); }
    if (!phone) { return res.status(400).send({ status: false, message: "Phone is mandatory" }); }
    if (file && file.length == 0) { return res.status(400).send({ status: false, message: "ProfileImage is a mandatory" }); }
    if (!password) { return res.status(400).send({ status: false, message: "Password is mandatory" }); }
    if (!address) { return res.status(400).send({ status: false, message: "Address is required" }); }
    
    
    if (!validName(fname.trim())) { return res.status(400).send({ status: false, message: "FirstName should be in alphabets only" }); }
    if (!validName(lname.trim())) { return res.status(400).send({ status: false, message: "LastName should be in alphabets only" }); }
    
    if (!validEmail(email)) { return res.status(400).send({ status: false, message: "Please provide correct email" }); }
    let findEmail = await userModel.findOne({ email });
    if (findEmail) { return res.status(400).send({ status: false, message: "User with this email already exists" }); }
    
    if (!validPhone(phone)) { return res.status(400).send({ status: false, message: "Please provide correct phone number" }); }
    let findPhone = await userModel.findOne({ phone });
    if (findPhone) { return res.status(400).send({ status: false, message: "User with this phone number already exists" }); }
    
    if (!validPassword(password)) { return res.status(400).send({ status: false, message: "Password Should be (8-15) in length with one upperCase, special character and number" }); }
    
    
    //..hashing
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds)
    
    address = JSON.parse(address)
    let { shipping, billing } = address

    if (!shipping) { return res.status(400).send({ status: false, message: "Shipping Address is mandatory" }); }
    if (!billing) { return res.status(400).send({ status: false, message: "Billing Address is required" }); }

    if (shipping) {
      if (!shipping.street) { return res.status(400).send({ status: false, message: "Shipping Street is mandatory" }); }
      if (!validValue(shipping.street)) { return res.status(400).send({ status: false, Message: "Please provide street name in string format" }); }

      if (!shipping.city) { return res.status(400).send({ status: false, message: "Shipping City is mandatory" }); }
      if (!validValue(shipping.city)) { return res.status(400).send({ status: false, Message: "Please provide city name in string format" }); }

      if (!shipping.pincode) { return res.status(400).send({ status: false, message: "Shipping Pincode is mandatory" }); }
      if (!validPincode(shipping.pincode)) { return res.status(400).send({ status: false, Message: "Please provide pincode in number format" }); }
    }

    if (billing) {
      if (!billing.street) { return res.status(400).send({ status: false, message: "Billing Street is mandatory" }); }
      if (!validValue(billing.street)) { return res.status(400).send({ status: false, Message: "Please provide street name in string format" }); }
      
      if (!billing.city) { return res.status(400).send({ status: false, message: "Billing City is mandatory" }); }
      if (!validValue(billing.city)) { return res.status(400).send({ status: false, Message: "Please provide city name in string format" }); }
      
      if (!billing.pincode) { return res.status(400).send({ status: false, message: "Billing Pincode is mandatory" }); }
      if (!validPincode(billing.pincode)) { return res.status(400).send({ status: false, Message: "Please provide pincode in number format" }); }
    }

    if (file && file.length > 0) {
      if (!isValidImg(file[0].originalname)) { return res.status(400).send({ status: false, message:"Please provide image in jpg|gif|png|jpeg|jfif " }); } 
    }
    let url = await uploadFile(file[0]);
    
    const userData = {
      fname: fname, lname: lname, profileImage: url, email: email,
      phone, password: hash, address: address
    }
    
    const user = await userModel.create(userData);
    return res.status(201).send({ status: true, message: "User created successfully", data: user });

  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}

//----------------------------------------[ LOGIN USER ]-------------------------------------//
const loginUser = async function (req, res) {
  try {
    let data = req.body
    if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "Please enter login details" }); }

    const { email, password } = data

    if (!email) { return res.status(400).send({ status: false, messsage: "Email is required" }); }
    if (!password) { return res.status(400).send({ status: false, messsage: "Password is required" }); }
    
    if (!validValue(email)) { return res.status(400).send({ status: false, Message: "Please provide email in string format" }); }
    if (!validEmail(email)) { return res.status(400).send({ status: false, message: "Please provide correct email" }); }

    if (!validValue(password)) { return res.status(400).send({ status: false, Message: "Please provide password in string format" }); }
    if (!validPassword(password)) { return res.status(400).send({ status: false, message: "Password Should be (8-15) in length with one upperCase, special character and number" }); }


    const userData = await userModel.findOne({ email: email })
    if (!userData) { return res.status(404).send({ status: false, message: "Email is incorrect" }); }

    const comparePassword = await bcrypt.compare(password, userData.password)
    if (!comparePassword) { return res.status(401).send({ status: false, msg: "Password is incorrect" }); }

    //token contain iat, exp, userId 
    const token = jwt.sign({ userId: userData._id }, "project5group22", { expiresIn: "5h" } )

    return res.status(200).send({ status: true, message: "User login successfull", data: { userId: userData._id, token: token } })
  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

//-----------------------------------------[ GET USER ]---------------------------------------------//

const getUser = async function (req, res) {
  try {
    const userId = req.params.userId;

    if (!validObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid user id" }); }

    let userData = await userModel.findOne({ _id: userId })

    if (!userData) { return res.status(404).send({ status: false, message: "User not found" }); }

    return res.status(200).send({ status: true, message: "User profile details", data: userData });

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

//--------------------------------------[ UPDATE USER ]---------------------------------------------//

const updateUser = async function (req, res) {
  try {
    const userId = req.params.userId;
    if (!validObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid user id" }); }

    const data = req.body;
    const file = req.files
    if (!isValidBody(data) && (typeof(file)=="undefined")) { return res.status(400).send({ status: false, message: "Please give some data" }); }

    let { fname, lname, email, phone, password, address } = data;
    
    const newobj ={}
    if(fname){
          if (!validName(fname.trim())) { return res.status(400).send({ status: false, message: "FirstName should be in alphabets only" }); }
          newobj.fname = fname
    }
     if(lname){
           if (!validName(lname.trim())) { return res.status(400).send({ status: false, message: "LastName should be in alphabets only" }); }
           newobj.lname = lname
      }
      if(email){
            if (!validEmail(email)) { return res.status(400).send({ status: false, message: "Please provide correct email" }); }
             let findEmail = await userModel.findOne({ email });
             if (findEmail) { return res.status(400).send({ status: false, message: "User with this email already exists" }); }
             newobj.email = email
      }
      if (file && file.length > 0) {
            if (!isValidImg(file[0].originalname)) { return res.status(400).send({ status: false, message: "Please provide image in jpg|gif|png|jpeg|jfif "}); }
            let url = await uploadFile(file[0]);
           newobj.profileImage = url
           
      }
      if(phone){
            if (!validPhone(phone)) { return res.status(400).send({ status: false, message: "Please provide correct phone number" }); }
            let findPhone = await userModel.findOne({ phone });
            if (findPhone) { return res.status(400).send({ status: false, message: "User with this phone number already exists" }); }
            newobj.phone = phone
      }
    if(password){
         if (!validPassword(password)) { return res.status(400).send({ status: false, message: "Password Should be (8-15) in length with one upperCase, special character and number" }); }
         const saltRounds = 10;
       newobj.password = bcrypt.hashSync(password, saltRounds)
       
    }
  
  if(address){
    address = JSON.parse(address)

    let { shipping, billing } = address

    if (shipping) {

      if(shipping.street){
      if (!validValue(shipping.street)) { return res.status(400).send({ status: false, Message: "Please provide street name in string format" }); }
          }

          if(shipping.city){
      if (!validValue(shipping.city)) { return res.status(400).send({ status: false, Message: "Please provide city name in string format" }); }
          }

          if(shipping.pincode){
      if (!validPincode(shipping.pincode)) { return res.status(400).send({ status: false, Message: "Please provide pincode in number format" }); }
          }
  }

    if (billing) {

      if(billing.street){
      if (!validValue(billing.street)) { return res.status(400).send({ status: false, Message: "Please provide street name in string format" }); }
      }
      
      if(billing.city){
      if (!validValue(billing.city)) { return res.status(400).send({ status: false, Message: "Please provide city name in string format" }); }
      }

      if(billing.pincode){
      if (!validPincode(billing.pincode)) { return res.status(400).send({ status: false, Message: "Please provide pincode in number format" }); }
      }
    }
    newobj.address = address
  }

    const userdata = await userModel.findOneAndUpdate({ _id: userId },{$set:newobj},{new:true});

    return res.status(200).send({ status: true, message: "User profile updated", data: userdata });
  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}


module.exports = { createUser, loginUser, getUser, updateUser }
