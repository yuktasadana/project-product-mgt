const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const { authorization, authentication } = require('../middleware/auth')

//......................User.........................
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/user/:userId/profile', authentication, userController.getUser);
router.put('/user/:userId/profile', authentication, authorization, userController.updateUser);

//......................Product.........................
router.post('/products', productController.createproduct)
router.get('/products', productController.getProductBYQuery)
router.get('/products/:productId', productController.getProduct)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteproduct)

//.......................CART................................
router.post('/users/:userId/cart', authentication, authorization, cartController.createCart)
router.get('/users/:userId/cart', authentication, authorization, cartController.getCart)
router.put('/users/:userId/cart', authentication, authorization, cartController.updateCart)
router.delete('/users/:userId/cart', authentication, authorization, cartController.deleteCart)

//.........................ORDER...................................
router.post('/users/:userId/orders', authentication, authorization, orderController.createOrder)
router.put('/users/:userId/orders', authentication, authorization, orderController.UpdateOrder)


router.all('/*', function (req, res) {
  res.status(400).send({ status: false, message: "Invalid HTTP request" });
})

module.exports = router