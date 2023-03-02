const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')
const { validObjectId,validValue } = require('../validator/validation')



//......................Create Order.........................

const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please Provide Some Data for create an Order" })

        const { cartId } = data
        if (!cartId) { return res.status(400).send({ status: false, message: "CartId is required in body" }) }
        if (!validObjectId(cartId)) { return res.status(400).send({ staus: false, message: "Please provide a valid cartId" }); }

        const cartCheck = await cartModel.findOne({ userId: userId, _id: cartId })
        if (!cartCheck) { return res.status(400).send({ staus: false, message: "Cart not found" }); }
        if (cartCheck.items.length == 0) { return res.status(400).send({ status: false, message: "No product found in items" }) }

        //......total Product Qty........
        let totalQuantity = 0
        for (let i = 0; i < cartCheck.items.length; i++) {
            totalQuantity = totalQuantity + cartCheck.items[i].quantity
        }

        const obj = {
            userId: userId,
            items: cartCheck.items,
            totalPrice: cartCheck.totalPrice,
            totalItems: cartCheck.totalItems,
            totalQuantity: totalQuantity,
            cancellable: data.cancellable
        }

        const order = await orderModel.create(obj)
        await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })

        res.status(201).send({ status: true, message: "Success", data: order })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


//.....................Update Order..........................

const UpdateOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!validObjectId(userId)) { return res.status(400).send({ status: false, message: "Please Provide a valid User Id" }) }

        const data = req.body
        const { orderId, status } = data

        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "Please give some data" }); }

        if (!orderId) { return res.status(400).send({ status: false, message: "OrderId is mandatory in body" }); }
        if (!status) { return res.status(400).send({ status: false, message: "Status is mandatory in body" }); }
        if (!validValue(orderId)) { return res.status(400).send({ status: false, message: "OrderId should be in string format only" }); }
        if (!validValue(status)) { return res.status(400).send({ status: false, message: "Status should be in string format only" }); }
        if (!validObjectId(orderId)) { return res.status(400).send({ status: false, message: "Please Provide a valid orderId" }); }
        
        if (status != "completed" && status != "canceled") { return res.status(400).send({ status: false, message: "Status is only accepted in completed or canceled" }); }

        const findOrder = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!findOrder) { return res.status(404).send({ status: false, message: "Order not exist with this orderId" }); }

        const UpdateObj = {}
        UpdateObj.status = status

        if (findOrder.status == "completed" || findOrder.status == "canceled") {
            return res.status(400).send({ status: false, message: "Your order Status is already updated. Now You can't change" });
        }

        if (findOrder.cancellable == false && status == "canceled") { return res.status(400).send({ status: false, message: "This order is not provided cancellable Policy" }); }

        let updateData = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: UpdateObj }, { new: true });

        return res.status(200).send({ status: true, message: "Success", data: updateData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { createOrder, UpdateOrder }