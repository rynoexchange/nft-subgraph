import { Collection, Item, Transaction } from "../generated/schema"
import { ListingCreated, ListingRemoved, ListingSold } from "../generated/RynoNFTMarket/RynoNFTMarket";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function handleListingCreated(event: ListingCreated): void {
  let collection = Collection.load(event.params.collection.toHex());

  if (!collection) {
    collection = new Collection(event.params.collection.toHex());
    collection.save();
  }

  let item = getItem(event.params.collection, event.params.tokenId, event.block.timestamp);

  item.price = event.params.price;
  item.owner = event.params.owner.toHex();
  item.collection = collection.id;
  item.listedAt = event.block.timestamp;
  item.save()

  let transaction = new Transaction(event.transaction.hash.toHex());
  transaction.type = 'add';
  transaction.from = item.owner;
  transaction.item = item.id;
  transaction.amount = event.params.price;
  transaction.createdAt = event.block.timestamp;
  transaction.save();
}

export function handleListingRemoved(event: ListingRemoved): void {
  let item = getItem(event.params.collection, event.params.tokenId, event.block.timestamp);
  item.price = null;
  item.save();

  let transaction = new Transaction(event.transaction.hash.toHex());
  transaction.type = 'remove';
  transaction.item = item.id;
  transaction.from = item.owner;
  transaction.createdAt = event.block.timestamp;
  transaction.save();
}

export function handleListingSold(event: ListingSold): void {
  let item = getItem(event.params.collection, event.params.tokenId, event.block.timestamp);
  item.owner = event.params.buyer.toHex();
  item.price = null;
  item.save();

  let transaction = new Transaction(event.transaction.hash.toHex());
  transaction.type = 'buy';
  transaction.item = item.id;
  transaction.amount = event.params.price;
  transaction.createdAt = event.block.timestamp;
  transaction.from = event.params.buyer.toHex();
  transaction.save();
}

function getItem(collection: Address, tokenId: BigInt, timestamp: BigInt): Item {
  const id = collection.toHex() + '::' + tokenId.toString();

  let item = Item.load(id);
  if (!item) {
    item = new Item(id);
    item.createdAt = timestamp;
  }

  return item;
}