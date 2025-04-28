import proj4 from 'proj4';
import * as turf from '@turf/turf';
// 定义坐标系
const sourceProjection = 'EPSG:4326'; // WGS84
const targetProjection = 'EPSG:3857'; // Web Mercator

// 示例坐标（WGS84，纬度和经度）
const wgs84Coords = [116.404, 39.915]; // 例如：柏林的经纬度

// 转换坐标
const webMercatorCoords = proj4(sourceProjection, targetProjection, wgs84Coords);

console.log('Web Mercator 坐标:', webMercatorCoords);

// 12958034.006300217, 4853597.9882998355
// 12957755.672570655, y: 4853493.734828266


var pt = turf.point(wgs84Coords);
var converted = turf.toMercator(pt);

console.log("converted",converted)