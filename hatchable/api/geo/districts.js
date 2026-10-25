export const access = 'public';
export const methods = ['GET'];

// The district map is a static file in public/; this keeps the client's /api/geo/districts URL working.
export default async function (req, res) {
  return res.redirect('/districts.geojson');
}
