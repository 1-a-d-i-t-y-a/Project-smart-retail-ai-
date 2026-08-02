import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 60000 });

// Dashboard
export const getStats = () => client.get("/dashboard/stats").then((r) => r.data);
export const getTimeline = (days = 7) =>
  client.get("/dashboard/visits-timeline", { params: { days } }).then((r) => r.data);
export const getCategoryDist = () =>
  client.get("/dashboard/category-distribution").then((r) => r.data);
export const getActivity = (limit = 12) =>
  client.get("/dashboard/activity", { params: { limit } }).then((r) => r.data);

// Sentiment
export const analyzeSentiment = (text, source) =>
  client.post("/sentiment/analyze", { text, source }).then((r) => r.data);
export const analyzeBulk = (items) =>
  client.post("/sentiment/bulk", { items }).then((r) => r.data);
export const getSentimentHistory = (limit = 100) =>
  client.get("/sentiment/history", { params: { limit } }).then((r) => r.data);
export const getSentimentSummary = () =>
  client.get("/sentiment/summary").then((r) => r.data);

// Chatbot
export const sendChatMessage = (session_id, message) =>
  client.post("/chat/message", { session_id, message }).then((r) => r.data);
export const getChatHistory = (session_id) =>
  client.get(`/chat/history/${session_id}`).then((r) => r.data);
export const getSessions = () => client.get("/chat/sessions").then((r) => r.data);
export const getFaqs = () => client.get("/chat/faqs").then((r) => r.data);
export const addFaq = (faq) => client.post("/chat/faqs", faq).then((r) => r.data);
export const deleteFaq = (id) => client.delete(`/chat/faqs/${id}`).then((r) => r.data);

// Vision - Face
export const registerFace = (name, image_base64) =>
  client.post("/vision/face/register", { name, image_base64 }).then((r) => r.data);
export const recognizeFace = (image_base64) =>
  client.post("/vision/face/recognize", { image_base64 }).then((r) => r.data);
export const listCustomers = () =>
  client.get("/vision/face/customers").then((r) => r.data);
export const deleteCustomer = (id) =>
  client.delete(`/vision/face/customers/${id}`).then((r) => r.data);
export const listVisits = (limit = 100) =>
  client.get("/vision/face/visits", { params: { limit } }).then((r) => r.data);

// Vision - Products
export const classifyProduct = (image_base64, filename) =>
  client.post("/vision/product/classify", { image_base64, filename }).then((r) => r.data);
export const productHistory = (limit = 100) =>
  client.get("/vision/product/history", { params: { limit } }).then((r) => r.data);
export const productSummary = () =>
  client.get("/vision/product/summary").then((r) => r.data);
