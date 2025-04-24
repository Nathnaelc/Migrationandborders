// Import the full raw dataset
import rawData from '../../csvjson.json';

// Filter for entries that have the required properties
// And clean/transform the data for our visualization
export const processedCityData = rawData
  .filter(city => {
    // Check if this entry has the core properties we need
    return (
      city &&
      typeof city.place === 'string' && 
      typeof city.places_to_work === 'string' &&
      (typeof city.latitude === 'number' || !isNaN(parseFloat(String(city.latitude)))) &&
      (typeof city.longitude === 'number' || !isNaN(parseFloat(String(city.longitude)))) &&
      typeof city.nomad_score === 'number' &&
      typeof city.internet_speed === 'number'
    );
  })
  .map(city => {
    // Use either place or places_to_work as the city name
    const cityName = typeof city.place === 'string' ? city.place : city.places_to_work;
    
    return {
      place: cityName,
      latitude: parseFloat(String(city.latitude)),
      longitude: parseFloat(String(city.longitude)),
      nomad_score: parseFloat(String(city.nomad_score)),
      internet_speed: parseFloat(String(city.internet_speed)),
      cost_nomad: typeof city.cost_nomad === 'number' ? city.cost_nomad : 0,
      safety: typeof city.safety === 'number' ? city.safety : 0,
      life_score: typeof city.life_score === 'number' ? city.life_score : 0,
      friendly_to_foreigners: typeof city.friendly_to_foreigners === 'number' ? city.friendly_to_foreigners : 0
    };
  })
  .filter(city => {
    // Final filter to ensure we have valid coordinates
    return !isNaN(city.latitude) && !isNaN(city.longitude) && 
           city.place !== undefined && city.place !== null;
  });

export default processedCityData;