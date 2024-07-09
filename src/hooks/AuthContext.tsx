import { CreateTeacher, Teacher } from "@/interfaces/Teacher";
import { api, suapApi } from "@/services/api";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import { data } from "autoprefixer";

interface AuthProviderProps {
	children: React.ReactNode;
}

interface AuthContextValues {
	user: Teacher | undefined;
	loading: boolean;
	setUser: React.Dispatch<React.SetStateAction<Teacher | undefined>>;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	getTeacherProfile: (registration: string) => Promise<any>;
	hasTeacherPermissions: boolean;
	hasEmployeePermissions: boolean;
}

const AuthContext = createContext({} as AuthContextValues);

const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<Teacher | undefined>(() => {
		const storagedSession = localStorage.getItem("@ClassPlanner:user");

		const savedUser = storagedSession ? JSON.parse(storagedSession) : null;
		return savedUser;
	});

	const [loading, setLoading] = useState<boolean>(true);

	const hasTeacherPermissions = user?.department === "Professor";
	const hasEmployeePermissions = user?.department === "Aluno";

	const router = useRouter();

	const registerTeacher = useCallback(async (new_teacher: CreateTeacher) => {
		try {
			const { data } = await api.post("token/", new_teacher);

			return data;
		} catch (error) {
			console.warn("Erro ao tentar cadastrar estudante ->", error);
		}
	}, []);

	const getTeacherIsRegistered = useCallback(async (registration: string) => {
		try {
			const { data } = await api.get(
				`teachers/byregistration/${registration}/`
			);

			return data;
		} catch (error) {
			console.warn(
				"Erro ao tentar verificar se estudante está registrado ->",
				JSON.stringify(error)
			);
			return false;
		}
	}, []);

	const getTeacherProfile = useCallback(async () => {
		try {
			const { data } = await api.get(`users/me/`);

			// if (data.tipo_vinculo !== "Aluno") {
			// 	console.warn("Apenas estudantes podem se autenticar");
			// 	return;
			// }

			let teacher = await getTeacherIsRegistered(data.registration);

			if (!teacher) {
				teacher = await registerTeacher({
					registration: data.matricula,
					name: data.nome_usual,
					department: data.tipo_vinculo,
					email: data.email,
					avatar: data.url_foto_75x100,
				});
			}

			setUser(teacher);

			localStorage.setItem("@ClassPlanner:user", JSON.stringify(teacher));
		} catch (error) {
			console.log("Erro ao tentar pegar o perfil do usuário ->", error);
		}
	}, []);

	const login = useCallback(async (username: string, password: string) => {
		try {
			const params = {
				registration: username,
				password: password,
			};

			const { data } = await api.post("token/", params);

			localStorage.setItem("@ClassPlanner:token", data.access);
			localStorage.setItem("@ClassPlanner:refresh", data.refresh);

			getTeacherProfile();
		} catch (error) {
			throw new Error("Erro ao tentar fazer login");
		}
	}, []);

	const logout = useCallback(async () => {
		setUser(undefined);

		router.push('/entrar')

		localStorage.removeItem("@ClassPlanner:user");
		localStorage.removeItem("@ClassPlanner:token");
		localStorage.removeItem("@ClassPlanner:refresh");
	}, []);

	const loadSavedSession = async () => {
		// const storagedSession = localStorage.getItem("@ClassPlanner:user");

		// const savedUser = storagedSession ? JSON.parse(storagedSession) : null;
		// if (savedUser) setUser(savedUser);
		setLoading(true);
		try {
			const storagedSession = localStorage.getItem("@ClassPlanner:user");
			const savedUser = storagedSession ? JSON.parse(storagedSession) : null;
			if (savedUser) setUser(savedUser);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSavedSession();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				setUser,
				login,
				logout,
				getTeacherProfile,
				hasTeacherPermissions,
				hasEmployeePermissions,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

const useAuth = () => {
	const context = useContext(AuthContext);

	return context;
};

export { useAuth, AuthProvider };
