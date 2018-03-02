const uuid = require('uuid4')
const {DataTypes} = require('sequelize')
const {STRING, DATE, JSON, UUID, INTEGER, BLOB, BIGINT} = DataTypes
const ADDRESS = STRING(42)
const TRANSACTION_HASH = STRING(66)

module.exports = (sequelize) => {
  const Request = sequelize.define(
    'requests',
    {
      id: {type: UUID, primaryKey: true},
      type: {
        type: STRING(256),
        validate: {isIn: [['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']]},
        allowNull: false,
      },
      error: {type: JSON},
      data: {type: JSON, allowNull: false},
      result: {type: JSON},
      createdAt: {type: DATE, allowNull: false},
      sentAt: {type: DATE},
      completedAt: {type: DATE},
    },
    {
      indexes: [
        {fields: ['id']},
        {fields: ['type']},
        {fields: ['createdAt']},
        {fields: ['completedAt']},
        {fields: ['sentAt']},
      ],
    }
  )

  const Transaction = sequelize.define(
    'transactions',
    {
      id: {type: UUID, primaryKey: true, defaultValue: () => uuid()},
      requestId: {type: UUID, allowNull: false, references: {model: 'requests', key: 'id'}},
      type: {
        type: STRING(256),
        validate: {isIn: [['send', 'deploy']]},
        allowNull: false,
      },
      subRequestIndex: {type: INTEGER, defaultValue: 0},
      subRequestData: {type: JSON},
      subRequestType: {type: STRING(256)},
      transactionHash: {type: TRANSACTION_HASH},
      transactionData: {type: BLOB}, // ?
      network: {type: STRING(256), allowNull: false},
      from: {type: ADDRESS, allowNull: false},
      to: {type: ADDRESS},
      currentBlockTime: {type: DATE},
      blockNumber: {type: BIGINT},
      nounce: {type: INTEGER}, // ?
      gasPrice: {type: INTEGER}, // ?
      receipt: {type: STRING(256)}, // ?
      createdAt: {type: DATE, allowNull: false},
      sentAt: {type: DATE},
      completedAt: {type: DATE},
    },
    {
      indexes: [
        {fields: ['requestId']},
        {fields: ['type']},
        {fields: ['transactionHash']},
        {fields: ['createdAt']},
        {fields: ['completedAt']},
        {fields: ['sentAt']},
        {fields: ['from']},
        {fields: ['to']},
      ],
    }
  )
  Transaction.belongsTo(Request)
  Request.hasMany(Transaction)

  return sequelize
}
