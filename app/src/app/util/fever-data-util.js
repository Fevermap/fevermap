/* eslint-disable no-bitwise */
// Actual usage of F versus C in measuring body temperature is unclear, this mapping largely assumes
// weather and body temperature units correlate.
const fahrenheitTerritories = {
  CA: false, // Canada uses both, and F mostly for cooking
  US: true,
  'US-AS': true,
  'US-GU': true,
  'US-MP': true,
  'US-PR': true,
  'US-UM': true,
  'US-VI': true,
  BZ: true, // Belize
  PW: true, // Palau
  FM: true, // Micronesia
  BS: true, // Bahamas
  MH: true, // Marshall Islands
  KY: true, // Cayman
};

export default class FeverDataUtil {
  static fahrenheitToCelsius(value) {
    return ((value - 32) / 1.8).toFixed(1);
  }

  static celsiusToFahrenheit(value) {
    return (value * 1.8 + 32).toFixed(1);
  }

  static useFahrenheit(geoCodingInfo) {
    return geoCodingInfo && geoCodingInfo.countryShort
      ? !!fahrenheitTerritories[geoCodingInfo.countryShort]
      : false;
  }

  /**
   * @param reverse Use the other unit
   * @param value Value to stringify
   * @param geoCodingInfo Geocoding information for determining what measurement type to use
   * @return {string}
   */
  static getFeverWithUnit(reverse, value, geoCodingInfo) {
    const feverValue = value;
    return !!reverse ^ FeverDataUtil.useFahrenheit(geoCodingInfo)
      ? `${FeverDataUtil.celsiusToFahrenheit(feverValue)} °F`
      : `${Number(feverValue).toFixed(1)} °C`;
  }

  static getFeverWithUnitWithoutSuffix(reverse, value, geoCodingInfo) {
    const feverValue = value;
    return !!reverse ^ FeverDataUtil.useFahrenheit(geoCodingInfo)
      ? FeverDataUtil.celsiusToFahrenheit(feverValue)
      : Number(feverValue).toFixed(1);
  }

  static getFeverUnitSuffix(reverse, geoCodingInfo) {
    return !!reverse ^ FeverDataUtil.useFahrenheit(geoCodingInfo) ? '°F' : '°C';
  }
}
