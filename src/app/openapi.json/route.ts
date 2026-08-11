import spec from "@/openapi.json";

/**
 * The OpenAPI document, served at **resourcepack.ai/docs/openapi.json**.
 *
 * The reference pages already render this, but a rendered page is prose to
 * anything that isn't a person: a client generator, a Postman/Insomnia import,
 * or an assistant asked to write against this API has to guess field names from
 * HTML. Publishing the document itself is the difference between "it inferred
 * the shape" and "it read the shape".
 *
 * `force-static` because the file is compiled into the bundle — there is
 * nothing per-request here, and this app prerenders everything else.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Long-lived at the edge: it only changes when a route does, and a
      // deploy replaces it. Same posture as landing's llms.txt.
      "cache-control": "public, max-age=3600",
      // Consumed cross-origin by client generators and browser-based API
      // explorers. It's a public document describing a public API — there is
      // nothing here that isn't already on the reference pages.
      "access-control-allow-origin": "*",
    },
  });
}
