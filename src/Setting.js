
import Random from './Random'

/**
 * Abstract setting.
 */
export default class Setting {
  /**
   * Setting constructor. Override is required to call super.
   * @param {string} name
   * @param {Object} [spec]
   * @param {mixed} [spec.value] Default Setting value.
   * @param {function(setting: Setting, rawValue: mixed): boolean}
   * [spec.validateValue] Function to execute whenever a value
   * gets validated, returns true if valid.
   * @param {function(setting: Setting, rawValue: mixed): mixed}
   * [spec.filterValue] Function to execute whenever a value
   * gets filtered, returns filtered value.
   * @param {function(setting: Setting, random: Random): mixed}
   * [spec.randomizeValue] Function to execute whenever a random Setting value
   * gets requested, returns randomly chosen value.
   */
  constructor (name, spec = {}) {
    this._name = name
    this._value = spec.value || null
    this._valid = true
    this._delegate = null

    this._validateValueCallback = spec.validateValue || null
    this._filterValueCallback = spec.filterValue || null
    this._randomizeValueCallback = spec.randomizeValue || null
  }

  /**
   * Returns name.
   * @return {string} Setting name
   */
  getName () {
    return this._name
  }

  /**
   * Returns the delegate.
   * @return {?Object}
   */
  getDelegate () {
    return this._delegate
  }

  /**
   * Returns true, if delegate is set.
   * @return {boolean} True, if delegate is set.
   */
  hasDelegate () {
    return this._delegate !== null
  }

  /**
   * Sets the delegate.
   * @param {?Object} delegate
   * @return {Setting} Fluent interface
   */
  setDelegate (delegate) {
    this._delegate = delegate
    return this
  }

  /**
   * Returns true, if value is valid.
   * @return {boolean} True, if valid.
   */
  isValid () {
    return this._valid
  }

  /**
   * Returns value.
   * @return {mixed}
   */
  getValue () {
    return this._value
  }

  /**
   * Sets value, validates it, filters it and notifies delegate.
   * @param {mixed} rawValue Setting value.
   * @param {?Object} [sender] Sender object of this request.
   * Delegate will only be notified if it differs from given sender.
   * @return {Setting} Fluent interface
   */
  setValue (rawValue, sender = null) {
    // validate value
    this._valid = this.validateValue(rawValue)
    if (!this._valid) {
      this._value = rawValue
      return this
    }

    // filter value
    const value = this.filterValue(rawValue)

    // check if value changed
    if (this._value !== value) {
      this._value = value

      // notify delegate
      if (this.hasDelegate() && this.getDelegate() !== sender) {
        this.getDelegate().settingValueDidChange(this, value)
      }
    }

    return this
  }

  /**
   * Revalidates current value, sets {@link Setting.isValid} flag to
   * false if not valid.
   * @return {Setting} Fluent interface
   */
  revalidateValue () {
    return this.setValue(this.getValue())
  }

  /**
   * Validates given raw value. Called whenever a value gets set
   * using {@link Setting.setValue}. Override is required to call super.
   * @override
   * @param {mixed} rawValue Value to be validated.
   * @return {boolean} True, if valid.
   */
  validateValue (rawValue) {
    if (this._validateValueCallback !== null) {
      return this._validateValueCallback(this, rawValue)
    }
    // generic Setting objects accept any value
    return true
  }

  /**
   * Filters given raw value. Called whenever a value gets set
   * using {@link Setting.setValue}. Override is required to call super.
   * @override
   * @param {mixed} rawValue Value to be filtered.
   * @return {mixed} Filtered value
   */
  filterValue (rawValue) {
    if (this._filterValueCallback !== null) {
      return this._filterValueCallback(this, rawValue)
    }
    // generic Setting objects don't filter
    return rawValue
  }

  /**
   * Applies a randomly chosen value.
   * Uses {@link Setting.randomizeValue} internally.
   * @param {Random} [random] Random number generator
   * @return {Setting} Fluent interface
   */
  randomize (random = null) {
    let value = this.randomizeValue(random || new Random())
    return this.setValue(value)
  }

  /**
   * Returns a randomly chosen value.
   * @override
   * @param {Random} random Random number generator
   * @return {mixed} Randomly chosen value
   */
  randomizeValue (random) {
    if (this._randomizeValueCallback !== null) {
      return this._randomizeValueCallback(this, random)
    }
    // generic Setting objects don't know how to choose a random value
    // leave the current value as is
    return this.getValue()
  }

  /**
   * Serializes Setting value to make it JSON serializable.
   * @override
   * @throws Throws an error if safe serialization not possible.
   * @return {mixed} Serialized data
   */
  serializeValue () {
    const value = this.getValue()

    if (
      typeof value !== 'boolean' &&
      typeof value !== 'number' &&
      typeof value !== 'string'
    ) {
      throw new Error(
        `Generic Settings can only serialize boolean, number and string ` +
        `values safely. Found value type ${typeof value}.`)
    }

    return value
  }

  /**
   * Extracts value from {@link Setting.serializeValue} serialized data
   * and applies it to this Setting.
   * @override
   * @param {mixed} data Serialized data
   * @return {Setting} Fluent interface
   */
  extractValue (data) {
    this.setValue(data)
    return this
  }
}
