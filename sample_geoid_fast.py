from scipy.interpolate import RegularGridInterpolator
import numpy as np

interpolator = None

#this for multiprocessing
def set_interpolator(getinterpolator):
    global interpolator
    interpolator = getinterpolator

def load_fast_geoid():
    global interpolator
    heightmap = np.load('geoid_heightmap.npy')
    latitudes = np.load('geoid_lat.npy')
    longitudes = np.load('geoid_lon.npy')
    return RegularGridInterpolator((latitudes, longitudes), heightmap, bounds_error=False, fill_value=None)

def get_geoid_height(lat, lon):
    point = np.array([[lat, lon]])
    height = interpolator(point)
    return float(height[0])
