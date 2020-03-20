const apiKey = 'AIzaSyCnqW3oW88ainbGZYTqzv03x035GzS4IjI';
import countryList from 'src/assets/countrydata/country-data.json';

export default class GeolocatorService {
    static async getGeoCodingInfo(lat, lng) {
        return await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?result_type=postal_code|locality&language=EN&latlng=${lat},${lng}&key=${apiKey}`
        )
            .then(res => res.json())
            .then(res => GeolocatorService.parseResult(res))
            .catch(err => {
                console.error(err);
                return GeolocatorService.returnErrorMessage();
            });
    }

    static async getGeoCodingInfoByPostalCodeAndCountry(postalCode, country) {
        return await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?result_type=postal_code|locality&components=postal_code:${postalCode}|country:${country}&language=EN&key=${apiKey}`
        )
            .then(res => res.json())
            .then(res => GeolocatorService.parseResult(res))
            .catch(err => {
                console.error(err);
                return GeolocatorService.returnErrorMessage();
            });
    }

    static parseResult(res) {
        if (res.status !== 'OK' || res.results.length < 1) {
            return GeolocatorService.returnErrorMessage();
        }
        let firstResult = res.results[0];
        let addressComponents = firstResult.address_components;
        let postal = addressComponents.find(a => a.types.indexOf('postal_code') !== -1) || {};
        let city = GeolocatorService.findCityFromAddressComponents(addressComponents);
        let country = addressComponents.find(a => a.types.indexOf('country') !== -1) || {};
        return {
            success: true,
            postal_code: postal.long_name,
            city: city.long_name,
            country: country.long_name,
            countryShort: country.short_name,
            coords: firstResult.geometry.location,
        };
    }

    static findCityFromAddressComponents(addressComponents) {
        const locality = addressComponents.find(a => a.types.indexOf('locality') !== -1);
        if (locality) return locality;
        const postalTown = addressComponents.find(a => a.types.indexOf('postal_town') !== -1);
        if (postalTown) return postalTown;
        const administrativeAreaLevelOne = addressComponents.find(
            a => a.types.indexOf('administrative_area_level_1') !== -1
        );
        if (administrativeAreaLevelOne) return administrativeAreaLevelOne;
        const administrativeAreaLevelTwo = addressComponents.find(
            a => a.types.indexOf('administrative_area_level_2') !== -1
        );
        if (administrativeAreaLevelTwo) return administrativeAreaLevelTwo;
        return '';
    }

    /**
     * Country data from http://vocab.nic.in/rest.php/country/json
     */
    static getCountryList() {
        return countryList.countries;
    }

    static returnErrorMessage() {
        return { success: false, message: 'COULD_NOT_LOCATE' };
    }
}
