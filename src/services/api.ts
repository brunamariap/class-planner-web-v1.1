import axios from "axios";

export const api = axios.create({
	baseURL: "http://127.0.0.1:8000/api/",
});

export const suapApi = axios.create({
	baseURL: "https://suap.ifrn.edu.br/api/v2/",
});

// suapApi.interceptors.request.use(
// 	async (config) => {
// 		const token = localStorage.getItem("@ClassPlanner:token");
// 		const refresh = localStorage.getItem("@ClassPlanner:refresh");

// 		if (token) config.headers.Authorization = `Bearer ${token}`;

// 		return config;
// 	},
// 	(error) => {
// 		return Promise.reject(error);
// 	}
// );

api.interceptors.request.use(
	async (config) => {
		const token = localStorage.getItem("@ClassPlanner:token");
		const refresh = localStorage.getItem("@ClassPlanner:refresh");

		if (token) config.headers.Authorization = `Bearer ${token}`;

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Se o erro for 401 e não for uma tentativa de refresh token
		if (error.response && error.response.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			const refreshToken = localStorage.getItem("@ClassPlanner:refresh");

			if (refreshToken) {
				try {
					// Solicitar um novo token de acesso
					const response = await axios.post("token/refresh/", {
						refresh: refreshToken,
					});

					const newAccessToken = response.data.access;

					// Armazenar o novo token de acesso
					localStorage.setItem("@ClassPlanner:token", newAccessToken);

					// Atualizar o header Authorization do Axios com o novo token
					originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

					// Repetir a requisição original com o novo token
					return axios(originalRequest);
				} catch (refreshError) {
					console.error("Não foi possível atualizar o token de acesso.", refreshError);
					// Se a atualização do token falhar, limpar tokens e redirecionar para o login
					localStorage.removeItem("@ClassPlanner:token");
					localStorage.removeItem("@ClassPlanner:refresh");
					window.location.href = "/login";
					return Promise.reject(refreshError);
				}
			} else {
				// Se não houver refresh token, redirecionar para o login
				window.location.href = "/login";
			}
		}

		return Promise.reject(error);
	}
);
