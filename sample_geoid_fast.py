from scipy.interpolate import RegularGridInterpolator
import numpy as np
import os

interpolator = None

#this for multiprocessing
def set_interpolator(getinterpolator):
    global interpolator
    interpolator = getinterpolator

def load_fast_geoid():
    if not os.path.exists("geoid/geoid_heightmap.npy"):
        os.system("python3 precompute_egm96_geoid_heightmap.py")
    global interpolator
    heightmap = np.load('geoid/geoid_heightmap.npy')
    latitudes = np.load('geoid/geoid_lat.npy')
    longitudes = np.load('geoid/geoid_lon.npy')
    return RegularGridInterpolator((latitudes, longitudes), heightmap, bounds_error=False, fill_value=None)

def get_geoid_height(lat, lon):
    point = np.array([[lat, lon]])
    height = interpolator(point)
    return float(height[0])
