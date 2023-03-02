const cartModel = require('../models/cartModel')
const productModel = require("../models/productModel");
const { validValue, validObjectId } = require('../validator/validation')



//..........................................CREATE_CART.........................................................

const createCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "userId is not Valid" })

        const data = req.body;
        const { productId, cartId } = data
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please Provide Some Data for create a Cart" })

        if (!productId) return res.status(400).send({ status: false, message: "productId is required" })
        if (!validObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide a valid productId " })

        const findProductId = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProductId) { return res.status(404).send({ status: false, message: "Product is not  exist " }) }

        if (cartId) {
            if (!validValue(cartId)) { return res.status(400).status({ status: false, message: "cardId should not be empty" }) }
            if (!validObjectId(cartId)) return res.status(400).send({ status: false, message: "Please provide a valid cartId" })
        }

        //....................cartId....................................
        const findCart = await cartModel.findOne({ userId: userId })
        //if CartId not present
        if (!findCart) {
            let cartData = {
                userId: userId,
                items: [{ productId: productId, quantity: 1 }],
                totalPrice: findProductId.price,
                totalItems: 1
            }
            const createData = await cartModel.create(cartData)
            const finalData = await cartModel.findOne({ userId: userId }).select({ 'items._id': 0 })
            return res.status(201).send({ status: true, message: "Success", data: finalData })
        }
        //if cartId present
        if (findCart) {
            if (!cartId) {
                return res.status(400).send({ status: false, message: "you have already a Cart ,please provide cartId for the user" })
            }
            if (findCart._id != cartId) {
                return res.status(404).send({ status: false, message: "Cart id is not correct for this User" })
            }
        }

        // when user sending same productId 
        let array = findCart.items;
        for (let i = 0; i < array.length; i++) {
            if (array[i].productId == productId) {
                array[i].quantity = array[i].quantity + 1
                let updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: findCart.items, totalPrice: findCart.totalPrice + findProductId.price, totalItems: array.length }, { new: true }).select({ 'items._id': 0 })
                return res.status(201).send({ status: true, message: "Success", data: updateCart })
            }
        }
        //when user add another product
        let objData = {
            $addToSet: { items: { productId: findProductId._id, quantity: 1 } },
            totalPrice: findProductId.price + findCart.totalPrice,
            totalItems: findCart.totalItems + 1
        }

        let updateCart = await cartModel.findOneAndUpdate({ userId: userId }, objData, { new: true }).select({ 'items._id': 0 })
        return res.status(201).send({ status: true, message: "Success", data: updateCart });
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



//................................Update Cart................................

const updateCart = async function (req, res) {
    try {

        const userId = req.params.userId
        const data = req.body
        let { cartId, productId, removeProduct } = data

        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "Please provide some Data" }) }

        if (!cartId) { return res.status(400).send({ status: false, message: "CartId is required" }) }
        if (!productId) { return res.status(400).send({ status: false, message: "productId is required" }) }
        
        if (!validObjectId(cartId)) { return res.status(400).send({ status: false, message: "Please provide valid cartId" }) }
        if (!validObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide valid productId" }) }
       
        const cartCheck = await cartModel.findById({ _id: cartId })
        if (!cartCheck) { return res.status(404).send({ status: false, message: "cartId not found" }) }

        const productCheck = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productCheck) { return res.status(404).send({ status: false, message: "productId not found" }) }

        if (removeProduct != 0 && removeProduct != 1) { return res.status(400).send({ status: false, message: "please input a Number 0 or 1 in removeProduct Key" }) }
        if (cartCheck.items.length == 0) { return res.status(400).send({ status: false, message: "No product found in items" }) }

        //................Remove Item from Cart...................
        if (removeProduct == 0) {
            for (let i = 0; i < cartCheck.items.length; i++) {
                if (cartCheck.items[i].productId == productId) {
                    const ProductPrice = productCheck.price * cartCheck.items[i].quantity
                    const finalprice = cartCheck.totalPrice - ProductPrice
                    cartCheck.items.splice(i, 1)
                    const totalItems = cartCheck.totalItems - 1
                    const finalPriceAndUpdate = await cartModel.findOneAndUpdate({ userId: userId }, { items: cartCheck.items, totalPrice: finalprice, totalItems: totalItems }, { new: true }).select({ 'items._id': 0 })
                    return res.status(200).send({ status: true, message: "Success", data: finalPriceAndUpdate });
                }
            }

            //.................. Reduce/remove(qty < 1) Product Quantity.................
        } else if (removeProduct == 1) {
            for (let i = 0; i < cartCheck.items.length; i++) {
                if (cartCheck.items[i].productId == productId) {
                    const quantityUpdate = cartCheck.items[i].quantity - 1

                    //........Remove product from cart................
                    if (quantityUpdate < 1) {
                        const ProductPrice = productCheck.price * cartCheck.items[i].quantity
                        const finalprice = cartCheck.totalPrice - ProductPrice
                        cartCheck.items.splice(i, 1)
                        const totalItems = cartCheck.totalItems - 1
                        const finalPriceAndUpdate = await cartModel.findOneAndUpdate({ userId: userId }, { items: cartCheck.items, totalPrice: finalprice, totalItems: totalItems }, { new: true }).select({ 'items._id': 0 })
                        return res.status(200).send({ status: true, message: "Success", data: finalPriceAndUpdate });

                    } else {
                        //..............Reduce Qty of product.................
                        const finalprice = cartCheck.totalPrice - productCheck.price
                        const totalItems = cartCheck.totalItems
                        cartCheck.items[i].quantity = quantityUpdate

                        const finalPriceAndUpdate = await cartModel.findOneAndUpdate({ userId: userId }, { items: cartCheck.items, totalPrice: finalprice, totalItems: totalItems }, { new: true }).select({ 'items._id': 0 })
                        return res.status(200).send({ status: true, message: "Success", data: finalPriceAndUpdate });
                    }
                }
            }
            return res.status(400).send({ status: false, message: "No productId found in items" })

        }


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}





//..................................GET CART.................................................

const getCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!validObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide valid userId" }); }

        const cartData = await cartModel.findOne({ userId: userId, isDeleted: false }).select({ 'items._id': 0 })
        if (!cartData) { return res.status(400).send({ status: false, message: "Cart not found/already deleted" }); }

        return res.status(200).send({ status: true, message: "Success", data: cartData })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




//........................................Delete Cart...............................................

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!validObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide valid userId" }); }

        const cartData = await cartModel.findOne({ userId: userId, isDeleted: false })
        if (!cartData) { return res.status(400).send({ status: false, message: "Cart not found/already deleted" }); }

        const saveData = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })

        return res.status(204).send({ staus: true, message: "Success", data: saveData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
module.exports = { createCart, getCart, deleteCart, updateCart }