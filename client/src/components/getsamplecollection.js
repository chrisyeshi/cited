const sampleCollection = null

export default async function getSampleCollection (collId) {
  if (sampleCollection && sampleCollection.collId === collId) {
    return sampleCollection
  }
  return import(`./${collId}.json`)
}
