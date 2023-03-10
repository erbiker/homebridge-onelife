import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
} from 'homebridge';

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */
let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  api.registerAccessory('OneLifeXPlugin', OneLifeXAccessory);
};

class OneLifeXAccessory implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly name: string;
  private readonly api: API;
  private airPurifierActive = false;
  private airPurifierMode = false;

  private readonly airPurifierService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;
    this.api = api;

    this.airPurifierService = new hap.Service.AirPurifier(this.name);
    this.airPurifierService
      .getCharacteristic(hap.Characteristic.Active)
      .on(
        CharacteristicEventTypes.GET,
        (callback: CharacteristicGetCallback) => {
          log.info(
            'Current status of the air purifier was returned: ' +
              (this.airPurifierActive ? 'ACTIVE' : 'INACTIVE'),
          );
          callback(undefined, this.airPurifierActive);
        },
      )
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.airPurifierActive = value as boolean;
          log.info(
            'Air purifier status was set to: ' +
              (this.airPurifierActive ? 'ACTIVE' : 'INACTIVE'),
          );
          callback();
        },
      );

    this.airPurifierService
      .getCharacteristic(hap.Characteristic.CurrentAirPurifierState)
      .on(
        CharacteristicEventTypes.GET,
        (callback: CharacteristicGetCallback) => {
          log.info('Current state of the air purifier was returned: ');
          // here we make an api call to the device to get it's current status, then return it in the callback
          callback(
            undefined,
            true // current status of the device (there is also an IDLE state)
              ? hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR
              : hap.Characteristic.CurrentAirPurifierState.INACTIVE,
          );
        },
      );

    this.airPurifierService
      .getCharacteristic(hap.Characteristic.TargetAirPurifierState)
      .on(
        CharacteristicEventTypes.GET,
        (callback: CharacteristicGetCallback) => {
          log.info('Current state of the air purifier was returned: ');
          // here we make an api call to the device to get it's current status, then return it in the callback
          callback(
            undefined,
            this.airPurifierMode // current status of the device
              ? hap.Characteristic.TargetAirPurifierState.MANUAL
              : hap.Characteristic.TargetAirPurifierState.AUTO,
          );
        },
      )
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.airPurifierMode = value as boolean;
          log.info(
            'Air purifier status was set to: ' +
              (this.airPurifierActive ? 'AUTO' : 'MANUAL'),
          );
          callback();
        },
      );

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'OneLife')
      .setCharacteristic(hap.Characteristic.Model, 'OneLife X Air Purifier');

    log.info('Air purifier finished initializing!');
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log('Identify!');
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [this.informationService, this.airPurifierService];
  }
}
