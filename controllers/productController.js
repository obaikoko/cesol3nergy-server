import Product from '../models/productModel.js';
import asyncHandler from '../middleware/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';

// @desc Gets all products
// @route GET /api/products
// @privacy Public
const getProducts = asyncHandler(async (req, res) => {
  const category = req.query.category;
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  let query =
    category && category !== 'All'
      ? { ...keyword, category: { $regex: category, $options: 'i' } }
      : keyword;

  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const count = await Product.countDocuments(query);

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.status(200);
  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc Gets Single Product
// @route GET /api/products:id
// @privacy Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.status(200);
    res.json(product);
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    image: {
      url: '/images/sample.jpg',
    },
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;
 
  const product = await Product.findById(req.params.id);

  if (product) {
    if (image) {
      const existingImageId = product?.image?.publicId || '';

      if (existingImageId) {
        const newImageId = existingImageId.substring(
          existingImageId.indexOf('products') + 'products/'.length
        );
        const uploadedResponse = await cloudinary.uploader.upload(image, {
          folder: 'products',
          public_id: newImageId,
          transformation: [{ width: 640, height: 510, crop: 'scale' }],
        });
        product.image = {
          url: uploadedResponse.url,
          publicId: uploadedResponse.public_id,
        };
      } else {
        const uploadedResponse = await cloudinary.uploader.upload(image, {
          folder: 'products',
        });
        product.image = {
          url: uploadedResponse.url,
          publicId: uploadedResponse.public_id,
        };
      }
    }
    product.name = name;
    product.price = price;
    product.description = description;

    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    product.image.publicId &&
      (await cloudinary.uploader.destroy(product.image.publicId));
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: `${req.user.firstName} ${req.user.lastName}`,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);
  res.status(200);
  res.json(products);
});

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
};
