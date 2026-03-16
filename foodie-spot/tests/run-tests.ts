import assert from 'node:assert/strict';

import axios from 'axios';

import { getApiErrorMessage, getRemainingOfflineOrders, getResponseData } from '../services/api-utils';
import type { Order } from '../types';
import { validateLoginForm, validateRegisterForm } from '../utils/auth-validation';
import { buildNearbyRestaurantFilters, resolveHomeLocationLabel } from '../utils/home';

type TestCase = {
  name: string;
  run: () => void;
};

const buildOrder = (id: string): Order => ({
  id,
  restaurantId: 'r1',
  restaurantName: 'Demo',
  items: [],
  total: 20,
  deliveryFee: 3,
  status: 'pending',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  deliveryAddress: 'Paris',
});

const tests: TestCase[] = [
  {
    name: 'validateLoginForm checks required fields, email format, and password length',
    run: () => {
      assert.equal(validateLoginForm({ email: '', password: '' }), 'validation_email_required');
      assert.equal(validateLoginForm({ email: 'test@example', password: 'secret123' }), 'validation_email_invalid');
      assert.equal(validateLoginForm({ email: 'test@example.com', password: '' }), 'validation_password_required');
      assert.equal(validateLoginForm({ email: 'test@example.com', password: 'short' }), 'validation_password_too_short');
      assert.equal(validateLoginForm({ email: 'test@example.com', password: 'secret123' }), null);
    },
  },
  {
    name: 'validateRegisterForm enforces required names and password rules',
    run: () => {
      assert.equal(
        validateRegisterForm({
          firstName: '',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        }),
        'validation_first_name_required'
      );

      assert.equal(
        validateRegisterForm({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: '123',
          confirmPassword: '123',
        }),
        'validation_password_too_short'
      );

      assert.equal(
        validateRegisterForm({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret456',
        }),
        'validation_password_mismatch'
      );
    },
  },
  {
    name: 'getResponseData unwraps API envelopes and plain payloads',
    run: () => {
      assert.deepEqual(getResponseData({ data: { data: ['a', 'b'] } }), ['a', 'b']);
      assert.deepEqual(getResponseData({ data: ['x', 'y'] }), ['x', 'y']);
    },
  },
  {
    name: 'getApiErrorMessage maps timeout, API, and generic errors',
    run: () => {
      const timeoutError = new axios.AxiosError('timeout', 'ECONNABORTED');
      assert.equal(getApiErrorMessage(timeoutError), 'La requete a pris trop de temps. Veuillez reessayer.');

      const apiError = new axios.AxiosError(
        'bad request',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          data: { message: 'Email deja utilise' },
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: { headers: {} as never },
        }
      );
      assert.equal(getApiErrorMessage(apiError), 'Email deja utilise');
      assert.equal(getApiErrorMessage(new Error('Oops')), 'Oops');
    },
  },
  {
    name: 'getRemainingOfflineOrders keeps only failed order ids',
    run: () => {
      const offlineOrders = [buildOrder('o1'), buildOrder('o2'), buildOrder('o3')];

      assert.deepEqual(
        getRemainingOfflineOrders(offlineOrders, [{ id: 'o2' }, { id: 'o3' }]).map(order => order.id),
        ['o2', 'o3']
      );
      assert.deepEqual(getRemainingOfflineOrders(offlineOrders, []).map(order => order.id), []);
    },
  },
  {
    name: 'buildNearbyRestaurantFilters creates nearby API params from coordinates',
    run: () => {
      assert.deepEqual(
        buildNearbyRestaurantFilters({ latitude: 48.8566, longitude: 2.3522 }),
        {
          lat: 48.8566,
          lng: 2.3522,
          radius: 5,
          sortBy: 'distance',
        }
      );
    },
  },
  {
    name: 'resolveHomeLocationLabel prefers a resolved address and falls back otherwise',
    run: () => {
      assert.equal(
        resolveHomeLocationLabel('12 rue de Rivoli, Paris, France', 'Location unavailable'),
        '12 rue de Rivoli, Paris, France'
      );
      assert.equal(
        resolveHomeLocationLabel(null, 'Location unavailable', { latitude: 48.8566, longitude: 2.3522 }),
        '48.8566, 2.3522'
      );
      assert.equal(
        resolveHomeLocationLabel(null, 'Location unavailable'),
        'Location unavailable'
      );
      assert.equal(
        resolveHomeLocationLabel('   ', 'Location unavailable'),
        'Location unavailable'
      );
    },
  },
];

let failures = 0;

for (const testCase of tests) {
  try {
    testCase.run();
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} tests passed.`);
}
