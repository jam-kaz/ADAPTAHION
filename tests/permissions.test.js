import test from 'node:test';
import assert from 'node:assert/strict';

import {
    getAllowedGroups,
    canAccessGroup,
    ALL_GROUP_IDS
} from '../js/config/permissions.js';

// Проверка прав студента
test('Student can access own group only', () => {
    const user = {
        role: 'student',
        groupId: 'ПИ25-1'
    };

    assert.equal(canAccessGroup(user, 'ПИ25-1'), true);
    assert.equal(canAccessGroup(user, 'ПМ24-1'), false);
});

// Проверка прав куратора
test('Curator can access assigned groups only', () => {
    const user = {
        role: 'curator',
        assignedGroups: ['ПИ25-1', 'ПИ26-1']
    };

    assert.deepEqual(
        getAllowedGroups(user),
        ['ПИ25-1', 'ПИ26-1']
    );

    assert.equal(canAccessGroup(user, 'ИБ25-1'), false);
});

// Проверка прав деканата
test('Dean can access all groups', () => {
    assert.deepEqual(
        getAllowedGroups({ role: 'dean' }),
        ALL_GROUP_IDS
    );
});

// Проверка прав администратора
test('Admin can access all groups', () => {
    assert.deepEqual(
        getAllowedGroups({ role: 'admin' }),
        ALL_GROUP_IDS
    );
});

// Проверка неавторизованного пользователя
test('Unauthorized user has no access', () => {
    assert.deepEqual(getAllowedGroups(null), []);
});
