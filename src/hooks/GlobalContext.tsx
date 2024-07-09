import { Class, Course } from "@/interfaces/Course";
import { Teacher } from "@/interfaces/Teacher";
import { api, suapApi } from "@/services/api";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useAuth } from "./AuthContext";

interface GlobalProviderProps {
	children: React.ReactNode;
}

interface GlobalContextValues {
	courses: Course[];
	setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
	classes: Class[];
	setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
	teachers: Teacher[];
	setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;

	getAllCourses: () => Promise<void>;
	getAllClasses: () => Promise<void>;
	getAllTeachers: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextValues>(
	{} as GlobalContextValues
);

const GlobalProvider = ({ children }: GlobalProviderProps) => {
	const [courses, setCourses] = useState<Course[]>([]);
	const [classes, setClasses] = useState<Class[]>([]);
	const [teachers, setTeachers] = useState<Teacher[]>([]);

	const { user, loading } = useAuth();

	const getAllCourses = useCallback(async () => {
		const { data } = await api.get("courses/");

		setCourses(data);
	}, []);

	const getAllClasses = useCallback(async () => {
		const { data } = await api.get("classes/");

		setClasses(data);
	}, []);

	const getAllTeachers = useCallback(async () => {
		const { data } = await api.get("teachers/");

		setTeachers(data);
	}, []);

	useEffect(() => {
		if (!loading && user) {
			getAllCourses();
			getAllClasses();
			getAllTeachers();
		}
	}, [loading, user]);

	return (
		<GlobalContext.Provider
			value={{
				courses,
				setCourses,
				classes,
				setClasses,
				teachers,
				setTeachers,

				getAllCourses,
				getAllClasses,
				getAllTeachers,
			}}
		>
			{children}
		</GlobalContext.Provider>
	);
};

const useGlobal = () => {
	const context = useContext(GlobalContext);

	return context;
};

export { useGlobal, GlobalProvider };
