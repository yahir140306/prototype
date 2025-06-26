import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { createClient } from "../lib/supabase";

// Opción 1: Usando variables de entorno
const getRedirectUrl = () => {
	// Verifica si estás en producción o desarrollo
	const isProduction = import.meta.env.PROD;
	
	if (isProduction) {
		return "https://project-liard-alpha-81.vercel.app/api/exchange";
	} else {
		return "http://localhost:4321/api/exchange";
	}
};

// Opción 2: Usando una variable de entorno específica
const getRedirectUrlFromEnv = () => {
	return import.meta.env.PUBLIC_SITE_URL + "/api/exchange" || "http://localhost:4321/api/exchange";
};

// Opción 3: Detectando desde el request
const getRedirectUrlFromRequest = (request: Request) => {
	const url = new URL(request.url);
	return `${url.protocol}//${url.host}/api/exchange`;
};

const emailSignUp = async (
	{
		email,
	}: {
		email: string;
	},
	context: ActionAPIContext
) => {
	console.log("Sign up action");
	try {
		const supabase = createClient({
			request: context.request,
			cookies: context.cookies,
		});

		console.log("Request cookies:", context.request.headers.get("Cookie"));

		// Usa cualquiera de estos métodos:
		const redirectUrl = getRedirectUrlFromRequest(context.request); // Opción 3
		// const redirectUrl = getRedirectUrl(); // Opción 1
		// const redirectUrl = getRedirectUrlFromEnv(); // Opción 2

		const { data, error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: redirectUrl,
			},
		});

		if (error) {
			console.error("Sign up error", error);
			return {
				success: false,
				message: error.message,
			};
		} else {
			console.log("Sign up success", data);
			return {
				success: true,
				message: "Successfully logged in",
			};
		}
	} catch (err) {
		console.error("SignUp action other error", err);
		return {
			success: false,
			message: "Unexpected error",
		};
	}
};

export const server = {
	signIn: defineAction({
		accept: "form",
		input: z.object({
			email: z.string().email(),
		}),
		handler: async (input, context) => {
			return emailSignUp(input, context);
		},
	}),
	signOut: defineAction({
		handler: async (_, context) => {
			const supabase = createClient({
				request: context.request,
				cookies: context.cookies,
			});
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error("Sign out error", error);
				return {
					success: false,
					message: error.message,
				};
			}
			return {
				success: true,
				message: "Successfully signed out",
			};
		},
	}),
};