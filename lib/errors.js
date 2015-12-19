function APIError(message) {
  this.name = 'APIError';
  this.message = message;
  this.statusCode = 500;
}
APIError.prototype = Error.prototype;

function LoginError(message) {
  this.name = 'LoginError';
  this.message = message;
  this.statusCode = 401;
}
LoginError.prototype = Error.prototype;

function TeapotError() {
  this.name = 'TeapotError';
  this.message = 'I\'m a teapot.';
  this.statusCode = 418;
}
TeapotError.prototype = Error.prototype;

function NotImplementedError() {
  this.name = 'NotImplementedError';
  this.message = 'Not Implemented.';
  this.statusCode = 501;
}
NotImplementedError.prototype = Error.prototype;

function NotFoundError(message) {
  this.name = 'NotFoundError';
  this.message = message || 'Not Found.';
  this.statusCode = 404;
}
NotFoundError.prototype = Error.prototype;

function BadRequestError(message) {
  this.name = 'BadRequestError';
  this.message = message || 'Bad Request.';
  this.statusCode = 400;
}
BadRequestError.prototype = Error.prototype;

function InternalServerError(message) {
  this.name = 'InternalServerError';
  this.message = message || 'Internal Server Error.';
  this.statusCode = 500;
}
InternalServerError.prototype = Error.prototype;

function InvalidFlagError(message) {
  this.name = 'InvalidFlagError';
  this.message = message || 'Flag is invalid.';
  this.statusCode = 400;
}
InvalidFlagError.prototype = Error.prototype;

module.exports = {
  API: APIError,
  Login: LoginError,
  Teapot: TeapotError,
  NotImplemented: NotImplementedError,
  BadRequest: BadRequestError,
  Internal: InternalServerError,
  InvalidFlag: InvalidFlagError,
  NotFound: NotFoundError
};
