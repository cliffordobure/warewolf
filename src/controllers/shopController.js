const ShopItem = require('../models/ShopItem');
const ApiResponse = require('../utils/response');

// Get all shop items
exports.getShopItems = async (req, res, next) => {
  try {
    const items = await ShopItem.find({ is_active: true }).sort({ coins: 1 });

    const itemsResponse = items.map(item => ({
      id: item._id,
      name: item.name,
      description: item.description,
      coins: item.coins,
      price_usd: item.price_usd,
      price_eur: item.price_eur,
      price_gbp: item.price_gbp,
      price_cny: item.price_cny,
      image_url: item.image_url,
      is_popular: item.is_popular,
      discount_percent: item.discount_percent,
      is_active: item.is_active
    }));

    return ApiResponse.success(
      res,
      { items: itemsResponse },
      'Shop items retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get single shop item
exports.getShopItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await ShopItem.findById(itemId);
    
    if (!item) {
      return ApiResponse.error(res, 'Item not found', 'ITEM_NOT_FOUND', 404);
    }

    if (!item.is_active) {
      return ApiResponse.error(res, 'Item not available', 'ITEM_UNAVAILABLE', 400);
    }

    const itemResponse = {
      id: item._id,
      name: item.name,
      description: item.description,
      coins: item.coins,
      price_usd: item.price_usd,
      price_eur: item.price_eur,
      price_gbp: item.price_gbp,
      price_cny: item.price_cny,
      image_url: item.image_url,
      is_popular: item.is_popular,
      discount_percent: item.discount_percent
    };

    return ApiResponse.success(res, { item: itemResponse });
  } catch (error) {
    next(error);
  }
};

