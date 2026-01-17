
import { GAS_URL } from './store.js';

async function fetchFromGAS(action, payload = {}) {
    try {
        const response = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action, ...payload }),
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`API Error (${action}):`, error);
        return { success: false, message: error.message };
    }
}

export const api = {
    // Auth
    login: (password) => fetchFromGAS('login', { password }),

    // Ledger
    getLedger: () => fetchFromGAS('getLedger'),
    addLedger: (data) => fetchFromGAS('addLedger', data),
    updateLedger: (data) => fetchFromGAS('updateLedger', data),
    deleteLedger: (id) => fetchFromGAS('deleteLedger', { id }),
    batchAddLedger: (items) => fetchFromGAS('batchAddLedger', { items }),

    // Events
    getEvents: () => fetchFromGAS('getEvents'),
    addEvent: (data) => fetchFromGAS('addEvent', data),
    updateEvent: (data) => fetchFromGAS('updateEvent', data),

    // Rules
    getRules: () => fetchFromGAS('getRules'),
    addRule: (data) => fetchFromGAS('addRule', data),
    deleteRule: (id) => fetchFromGAS('deleteRule', { id }),

    // Foods
    getFoods: () => fetchFromGAS('getFoods'),
    addFood: (name) => fetchFromGAS('addFood', { name }),
    deleteFood: (name) => fetchFromGAS('deleteFood', { name }),

    // Board - Posts
    getPosts: () => fetchFromGAS('getPosts'),
    addPost: (data) => fetchFromGAS('addPost', data),
    updatePost: (data) => fetchFromGAS('updatePost', data),
    deletePost: (id) => fetchFromGAS('deletePost', { id }),
    incrementPostView: (id) => fetchFromGAS('incrementPostView', { id }),

    // Board - Comments
    getComments: (post_id) => fetchFromGAS('getComments', { post_id }),
    addComment: (data) => fetchFromGAS('addComment', data),
    deleteComment: (id) => fetchFromGAS('deleteComment', { id }),
};
