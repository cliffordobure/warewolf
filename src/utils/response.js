const { v4: uuidv4 } = require('uuid');

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4()
      }
    });
  }

  static error(res, message, code = 'ERROR', statusCode = 400, details = null) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4()
      }
    });
  }

  static paginated(res, items, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        items,
        pagination
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4()
      }
    });
  }
}

module.exports = ApiResponse;

