import Orders from '../models/orderModel.js';
import Users from '../models/userModel.js';
import Products from '../models/productModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

const accountData = asyncHandler(async (req, res) => {
  

  const orders = await Orders.find({});
  const deliveredOrder = orders.filter((order) => order.isDelivered === true);
  const paidOrders = orders.filter((order) => order.isPaid === true);
  const users = await Users.find({});
  const adminUsers = users.filter((user) => user.isAdmin === true);
  const products = await Products.find({});

  res.json({
    totalUsers: users.length,
    adminUsers: adminUsers.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    deliveredOrders: deliveredOrder.length,
    paidOrders: paidOrders.length,
  });
});

export { accountData };
