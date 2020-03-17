const apiKey = 'AIzaSyCnqW3oW88ainbGZYTqzv03x035GzS4IjI';

export default class GeolocatorService {
    static async getGeoCodingInfo(lat, lng) {
        return await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?result_type=postal_code&language=EN&latlng=${lat},${lng}&key=${apiKey}`
        )
            .then(res => res.json())
            .then(res => GeolocatorService.parseResult(res))
            .catch(err => GeolocatorService.returnErrorMessage());
    }

    static async getGeoCodingInfoByPostalCodeAndCountry(postalCode, country) {
        return await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${postalCode}|country:${country}&language=EN&key=${apiKey}`
        )
            .then(res => res.json())
            .then(res => GeolocatorService.parseResult(res))
            .catch(err => GeolocatorService.returnErrorMessage());
    }

    static parseResult(res) {
        if (res.status !== 'OK' || res.results.length < 1) {
            return GeolocatorService.returnErrorMessage();
        }
        let firstResult = res.results[0];
        let addressComponents = firstResult.address_components;
        return {
            success: true,
            postal_code: addressComponents[0].long_name,
            city: addressComponents[1].long_name,
            country: addressComponents[2].long_name,
            coords: firstResult.geometry.location,
        };
    }

    static returnErrorMessage() {
        return { success: false, message: 'COULD_NOT_LOCATE' };
    }
}
