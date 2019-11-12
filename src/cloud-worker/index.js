addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  return new Response('Hello worker!', {
    headers: { 'content-type': 'text/plain' },
  })
}

async function handleRequest(event) {
  let request = event.request
  let cacheUrl = new URL(request.url)
  // hostname for a different zone
  cacheUrl.hostname = someOtherHostname
  let cacheKey = new Request(cacheUrl, request)
  let cache = caches.default
  // Get this request from this zone's cache
  let response = await cache.match(cacheKey)
  if (!response) {
    //if not in cache, grab it from the origin
    response = await fetch(request)
    // must use Response constructor to inherit all of response's fields
    response = new Response(response.body, response)
    // Cache API respects Cache-Control headers, so by setting max-age to 10
    // the response will only live in cache for max of 10 seconds
    response.headers.append('Cache-Control', 'max-age=60')
    // store the fetched response as cacheKey
    // use waitUntil so computational expensive tasks don't delay the response
    event.waitUntil(cache.put(cacheKey, response.clone()))
  }
  return response
}

addEventListener('fetch', event => {
  try {
    return event.respondWith(handleRequest(event))
  } catch (e) {
    return event.respondWith(new Response('Error thrown ' + e.message))
  }
});

const someOtherHostname = 'my.herokuapp.com'