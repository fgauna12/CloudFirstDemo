addEventListener('fetch', event => {
  try {
    return event.respondWith(handleRequest(event))
  } catch (e) {
    return event.respondWith(new Response('Error thrown ' + e.message))
  }
});

async function handleRequest(event) {
  let request = event.request
  let cacheUrl = new URL("https://azapp-sampleapi-prod.azurewebsites.net/api/values")
  let downstreamRequest = new Request(cacheUrl, request)
  let cache = caches.default
  // Get this request from this zone's cache
  let response = await cache.match(request.url)
  if (!response) {
    //if not in cache, grab it from the origin
    response = await fetch(downstreamRequest)
    // must use Response constructor to inherit all of response's fields
    response = new Response(response.body, response)
    // Cache API respects Cache-Control headers, so by setting max-age to 10
    // the response will only live in cache for max of 10 seconds
    response.headers.append('Cache-Control', 'max-age=120')
    // store the fetched response as cacheKey
    // use waitUntil so computational expensive tasks don't delay the response
    event.waitUntil(cache.put(request.url, response.clone()))
  }
  return response
}