
const mongoose = require('mongoose')
const crypto = require('crypto')

const Schema = mongoose.Schema

/**
 * User Schema
 */

const UserSchema = new Schema({
    username: { type: String, default: '' }, // 用户名
    hashed_password: { type: String, default: '' },
    salt: { type: String, default: '' },
    createDate: { type: Date, default: Date.now }, // 创建时间
})

// 验证是否存在
const validatePresenceOf = value => value && value.length

/**
 * 虚拟属性 Virtuals   password
 */

UserSchema
    .virtual('password')
    .set(function (password) {
        this._password = password
        this.salt = this.makeSalt()
        this.hashed_password = this.encryptPassword(password)
    })
    .get(function () {
        return this._password
    })

/**
 * Validations
 * 验证
 */

UserSchema.path('username').validate(name => name.length, '用户名不能为空')
UserSchema.path('hashed_password').validate(pwd => pwd.length, '密码不能为空')

/**
 * Pre-save hook。 用户保存的钩子。 检测虚拟属性 password 是否为空
 */

UserSchema.pre('save', function (next) {
    if (this.isNew) {
        console.log('新用户：', this.username)
    }
    next()
})

/**
 * Methods
 */

UserSchema.methods = {

    /**
     * 验证 - 检测密码是否正确
     *
     * @param {String} 普通的文本（明文）
     * @return {Boolean}
     * @api public
     */

    authenticate(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password
    },

    /**
     * 创建 salt
     *
     * @return {String}
     * @api public
     */

    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + ''
    },

    /**
     * 加密 password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */

    encryptPassword: function (password) {
        if (!password) return ''
        try {
            return crypto
                .createHmac('sha1', this.salt)
                .update(password)
                .digest('hex')
        } catch (err) {
            return ''
        }
    },
}

/**
 * Statics
 */

UserSchema.statics = {
    /**
     * Load
     *
     * @param {Object} options
     * @param {Function} cb
     * @api private
     */

    load: function (options, cb) {
        options.select = options.select || 'username  _id'
        return this.findOne(options.criteria)
            .select(options.select)
            .exec(cb)
    },
    /**
     * 获取所有用户
     */
    _findAll() {
        return this.find({}).select('username  _id')
    }
}

module.exports = mongoose.model('User', UserSchema)