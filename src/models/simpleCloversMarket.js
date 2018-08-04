import r from 'rethinkdb'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'
import { padBigNum, dodb } from '../lib/util'
let db, io
// event updatePrice(uint256 _tokenId, uint256 price);
export let simpleCloversMarketUpdatePrice = async function({
	log,
	io: _io,
	db: _db
}) {
	db = _db
	io = _io

	console.log(log.name + ' called')
	let _tokenId = log.data._tokenId
	await changeCloverPrice(_tokenId, log)
}

export let simpleCloversMarketOwnershipTransferred = async function({
	log,
	io,
	db
}) {
	console.log(log.name + ' does not affect the database')
}

async function changeCloverPrice(_tokenId, log) {
	let price = log.data.price
	price = typeof price == 'object' ? price : new BigNumber(price)

	let command = r
		.db('clovers_v2')
		.table('clovers')
		.get(_tokenId)
	let clover = await dodb(db, command)

	clover.price = padBigNum(price.toString(16))
	clover.modified = log.blockNumber

	command = r
		.db('clovers_v2')
		.table('clover')
		.get(_tokenId)
		.update(clover)
	await dodb(db, command)
	io && io.emit('updateClover', clover)
}
