const Product = require('../models/productModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const cloudinary = require('../config/cloudinary');
const { categories } = require('../constants/categories');

// Get all categories
exports.getAllCategories = catchAsyncError(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=768000, immutable');
  res.status(200).json({
    success: true,
    data: categories,
  });
})

// create a new product
exports.createProduct = catchAsyncError(async (req, res, next) => {
  req.body.admin = req.user.id;
  let images = req.body.images;
  let newImages = [];
  for (let i = 0; i < images.length; i++) {
    const { public_id, url } = await cloudinary.uploader.upload(images[i], {
      folder: 'tomper-wear',
    });
    newImages.push({ public_id, url });
  }
  req.body.images = [...newImages];
  const product = await Product.create(req.body);
  res.status(200).json({
    success: true,
    data: product,
  });
});

// update an existing product
exports.updateProduct = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product Not Found', 400));
  }
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product Not Found', 200));
  }
  let images = req.body.images;
  let newImages = [];
  for (let i = 0; i < images.length; i++) {
    if (typeof images[i] === 'string') {
      const { public_id, url } = await cloudinary.uploader.upload(images[i], {
        folder: 'tomper-wear',
      });
      newImages.push({ public_id, url });
    } else {
      newImages.push(images[i]);
    }
  }
  req.body.images = [...newImages];
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

// delete an existing product
exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product Not Found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product Not Found', 200));
  }
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.uploader.destroy(product.images[i].public_id);
  }
  await product.remove();
  res.status(200).json({
    success: true,
    message: 'Product deleted',
  });
});

// send all product details
exports.getAllProducts = catchAsyncError(async (req, res) => {
  const q = new URLSearchParams(req.url.split('?').pop())
  
  const category = q.get('category')

  let products

  if (category) {
    products = await Product.find({ category: { $regex: new RegExp(category, 'i') } }).sort({ createdAt: -1 })
  } else {
    products = await Product.find().sort({ createdAt: -1 })
  }
  
  const data = products.map((item, index) => {
    const {
      _id: id,
      name,
      price,
      images,
      colors,
      sizes,
      company,
      description,
      category,
      stock,
      shipping,
      featured,
    } = item;
    const newItem = {
      id,
      name,
      price,
      images,
      colors,
      sizes,
      company,
      description,
      category,
      stock,
      shipping,
      featured,
    };
    return newItem;
  });
  res.status(200).json({
    success: true,
    data,
  });
});

// send only a single product detaisl
exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product Not Found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product Not Found', 200));
  }
  const newProduct = {
    id: product._id,
    name: product.name,
    price: product.price,
    rating: product.rating,
    numberOfReviews: product.numberOfReviews,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    company: product.company,
    description: product.description,
    category: product.category,
    stock: product.stock,
    shipping: product.shipping,
  }

  res.status(200).json({
    success: true,
    data: newProduct,
  });
});

// review a product
exports.createProductReview = catchAsyncError(async (req, res, next) => {
  const { rating, comment, productId, name, email } = req.body;
  if (!rating || !comment || !productId || !name || !email) {
    return next(new ErrorHandler('Request invalid', 400));
  }
  // creating a review
  const review = {
    name,
    email,
    rating: Number(rating),
    comment,
    createdAt: new Date()
  };
  const product = await Product.findById(productId);
  // check if the user already reviewed
  const isReviewed = product.reviews.some((rev) => rev.email === email);
  // user already review: update the review
  // user gives new review: add new review and update the number of reviews
  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.email === email) {
        rev.name = name;
        rev.rating = rating;
        rev.comment = comment;
        rev.createdAt = new Date()
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }
  // update product rating
  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  avg = avg / product.reviews.length;
  product.rating = avg;
  // save the product
  await product.save({ validateBeforeSave: false });
  // send success response
  res.status(200).json({
    success: true,
    message: 'Product review created',
  });
});

// send all product reviews
exports.getAllReviews = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product not found', 400));
  }
  const product = await Product.findById(req.params.id).sort({
    createdAt: -1
  });
  if (!product) {
    return next(new ErrorHandler('Product not found', 200));
  }
  const reviews = product.reviews;
  res.status(200).json({
    success: true,
    data: reviews,
  });
});

// delete product review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Product not found', 400));
  }
  const { reviewId } = req.body;
  if (!reviewId) {
    return next(new ErrorHandler('Review not found', 400));
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product not found', 200));
  }
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== reviewId.toString()
  );
  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });
  avg = avg / reviews.length;
  const rating = avg || 0;
  const numberOfReviews = reviews.length;
  await Product.findByIdAndUpdate(
    req.params.id,
    {
      rating,
      numberOfReviews,
      reviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    }
  );
  res.status(200).json({
    success: true,
    message: 'Review deleted',
  });
});
