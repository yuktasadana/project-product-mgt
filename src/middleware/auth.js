const jwt = require("jsonwebtoken");
const {validObjectId } = require('../validator/validation')
const userModel = require('../models/userModel')

//-------------------------------[ AUTHENTICATION ]--------------------------------//

const authentication = async function(req,res,Next){
    try {
        let token = req.headers["authorization"];
     
        if (!token) {
          return res.status(400).send({ status: false, message: "Token must be present." });
        }
      
        token = token.replace("Bearer ","")
       

        jwt.verify(token, 'project5group22', function (error, decoded) { 
    
          if (error) {
            return res.status(401).send({ status: false, message: error.message });
          }
          else {
            req.decodedToken = decoded

          
            Next()
          }
        })
      } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
      }
    
    }

const authorization = async ( req,res,Next) =>{
      try{
      
         const userId = req.params.userId;
      
         if (!validObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid user id" }); }
         let userData = await userModel.findOne({ _id: userId })
         if (!userData) { return res.status(404).send({ status: false, message: "User not found" }); }
   
         if(userId != req.decodedToken.userId){
          return res.status(403).send({ status: false, message: "You are Not Authorized For this Task 🤖" }); 
         }

   
          Next()


      }catch (error) {
        return res.status(500).send({ status: false, message: error.message });
      }
    }
    module.exports = {authentication,authorization}
