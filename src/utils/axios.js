import axios from 'axios';

// 創建一個映射來存儲每個請求的 AbortController
const abortControllers = new Map();

// https://pokeapi.co/api/v2/pokemon/ditto
const instance = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 5000,
  headers: { 'X-Custom-Header': 'foobar' }
});

instance.interceptors.request.use(
  (config) => {

    const key = `${config.url}@${config.method.toUpperCase()}`;
    
    // 檢查是否存在相同的請求，取消前一個請求
    if (abortControllers.has(key)) {
      const controller = abortControllers.get(key);
      controller.abort();
  }

    // 為當前請求創建一個新的 AbortController
    const newController = new AbortController()
    config.signal = newController.signal

    // 更新映射中的 AbortController
    abortControllers.set(key, newController);

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
);

instance.interceptors.response.use(
  (response) => {
    const key = `${response.config.url}@${response.config.method.toUpperCase()}`;
    // 請求完成後，從映射中移除 AbortController
    abortControllers.delete(key)

    return response
  },
  (error) => {
    const key = `${error.config.url}@${error.config.method.toUpperCase()}`;
    abortControllers.delete(key);
    return Promise.reject(error)
  }
);

// 導出一個函數來取消特定 URL 的請求
// export const cancelRequest = (url) => {
//     if (abortControllers.has(url)) {
//         const controller = abortControllers.get(url);
//         controller.abort();
//         abortControllers.delete(url);
//     }
// };

// 導出一個函數來取消特定 URL 和方法的请求
export const cancelRequest = (url, method) => {
  const key = `${url}@${method.toUpperCase()}`;
  if (abortControllers.has(key)) {
      const controller = abortControllers.get(key);
      controller.abort();
      abortControllers.delete(key);
  }
};

// 導出一個函數用於取消所有請求
export const cancelAllRequests = () => {
    abortControllers.forEach((controller, url) => {
        controller.abort();
        abortControllers.delete(url);
    });
};

export default instance
