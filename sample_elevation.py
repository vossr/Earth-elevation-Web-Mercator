from math import floor
import numpy as np
import rasterio
import os

def lat_lon_to_awd_filename(lat, lon, lat_index, lon_index):
    ns = 'N' if lat >= 0 else 'S'
    ew = 'E' if lon >= 0 else 'W'
    lat_index_str = f"{lat_index:03}"
    lon_index_str = f"{lon_index:03}"
    filename = f"ALPSMLC30_{ns}{lat_index_str}{ew}{lon_index_str}_DSM.tif"
    return filename

cache_size = 3
imagecache = []
def read_image_cached(lat, lon):
    lat_index = abs(floor(lat))
    lon_index = abs(floor(lon))
    global imagecache
    for item in imagecache:
        if item[0] == lat_index and item[1] == lon_index:
            return item[2], item[3]
    if len(imagecache) > cache_size:
        if imagecache[0][2]:#close rasterio tif
            imagecache[0][2].close()
        del imagecache[0]

    filename = "AW3D30_global/" + lat_lon_to_awd_filename(lat, lon, lat_index, lon_index)
    if os.path.exists(filename):
        tif = rasterio.open(filename)
        imagecache.append([lat_index, lon_index, tif, tif.read(1)])
    else:
        imagecache.append([lat_index, lon_index, None, None])
    return imagecache[-1][2], imagecache[-1][3]

def sample_elevation_aw3d30(lat, lon):
    tif, data = read_image_cached(lat, lon)
    if tif == None:
        return 0
    x, y = tif.index(lon, lat)
    return data[x, y]

def sample_elevation_aw3d30_array(lats, lons):
    lats = np.array(lats)
    lons = np.array(lons)
    elevations = np.zeros(lats.shape)
    allnone = True
    elevations = np.zeros_like(lats)
    try:
        for i, (lat, lon) in enumerate(zip(lats, lons)):
            tif, data = read_image_cached(lat, lon)
            if tif is None:
                elevations[i] = 0
            else:
                allnone = False
                x, y = tif.index(lon, lat)
                elevations[i] = data[x, y]
    except:
        pass
        # lat_index = abs(floor(lat))
        # lon_index = abs(floor(lon))
        # print("failed to compute elevation for:", lat, lon, x, y, lat_lon_to_awd_filename(lat, lon, lat_index, lon_index))
        #ALPSMLC30_N083W180_DSM.tif
    return elevations, allnone

