addEventListener('fetch', event => {
  try {
    return event.respondWith(handleRequest(event))
  } catch (e) {
    return event.respondWith(new Response('Error thrown ' + e.message))
  }
});

const backendUrl = "https://azapp-sampleapi-prod.azurewebsites.net/api/values";

async function handleRequest(event) {
  let request = event.request
  let cacheUrl = new URL(backendUrl)
  let downstreamRequest = new Request(cacheUrl, request)
  let cache = caches.default
  console.log('backend url', backendUrl);
  // Get this request from this zone's cache
  let response = await cache.match(backendUrl)
  if (!response) {
    //if not in cache, grab it from the origin
    response = await fetch(downstreamRequest)
    // must use Response constructor to inherit all of response's fields
    response = new Response(response.body, response)
    const newHeaders = new Headers(response.headers)
    newHeaders.delete('Cache-Control');
    newHeaders.delete('Server');
    newHeaders.delete('X-Powered-By');
    newHeaders.append('Cache-Control', 'max-age=120');
    response.headers = newHeaders;
    // Cache API respects Cache-Control headers, so by setting max-age to 120
    // the response will only live in cache for max of 120 seconds
    //response.headers.append('Cache-Control', 'max-age=120')
    // store the fetched response as cacheKey
    // use waitUntil so computational expensive tasks don't delay the response
    event.waitUntil(cache.put(backendUrl, response.clone()));
  }
  return response
}