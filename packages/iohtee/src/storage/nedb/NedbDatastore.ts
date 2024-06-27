import Datastore, { Document } from '@seald-io/nedb'
import Nedb from '@seald-io/nedb'

export class NedbDatastore {
  datastore: Datastore

  constructor(datastore: Datastore) {
    this.datastore = datastore
  }

  find<A>(query: any): Promise<Array<any>> {
    return this.datastore.findAsync(query)
  }

  findOne<A>(query: any): Promise<any> {
    return this.datastore.findOneAsync(query)
  }

  update<A>(
    query: any,
    updateQuery: any,
    options?: Nedb.UpdateOptions,
  ): Promise<{
    numAffected: number
    affectedDocuments: any
    upsert: boolean
  }> {
    return this.datastore.updateAsync(query, updateQuery, options)
  }

  insert<A>(
    newDoc: Record<string, any>,
  ): Promise<Document<Record<string, any>>> {
    return this.datastore.insertAsync(newDoc)
  }

  async count(query: any): Promise<number> {
    return (await this.datastore.countAsync(query)).valueOf()
  }

  remove(query: any, options: any): Promise<number> {
    return this.datastore.removeAsync(query, options)
  }
}
