package user

import (
	"fmt"
	"net/http"

	"github.com/lucas-remigio/wallet-tracker/config"
	"github.com/lucas-remigio/wallet-tracker/middleware"
	"github.com/lucas-remigio/wallet-tracker/service/auth"
	"github.com/lucas-remigio/wallet-tracker/types"
	"github.com/lucas-remigio/wallet-tracker/utils"
)

type Handler struct {
	store types.UserStore
}

func NewHandler(store types.UserStore) *Handler {
	return &Handler{store: store}
}

func (h *Handler) RegisterRoutes(router *http.ServeMux) {
	router.HandleFunc("/login", h.handleLogin)
	router.HandleFunc("/register", h.handleRegister)
	router.HandleFunc("/verify-token", middleware.AuthMiddleware(h.verifyToken))
}

func (h *Handler) verifyToken(w http.ResponseWriter, r *http.Request) {
	// If we reach here, the middleware has already verified the token
	// and the user is authenticated
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// parse and validate JSON payload
	var payload types.LoginUserPayload
	if !middleware.ValidatePayloadAndRespond(w, r, &payload) {
		return
	}

	// get the user from the store
	user, err := h.store.GetUserByEmail(payload.Email)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, fmt.Errorf("not found, invalid email or password"))
		return
	}

	// check if the password is correct
	if !auth.CheckPasswordHash([]byte(payload.Password), user.Password) {
		utils.WriteError(w, http.StatusNotFound, fmt.Errorf("not found, invalid email or password"))
		return
	}

	secret := []byte(config.Envs.JWTSecret)
	token, err := auth.CreateJWT(secret, user.ID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	isSecure := r.TLS != nil
	// Set the authToken as a secure, HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    token,
		Path:     "/",
		HttpOnly: true,                    // Prevents client-side JavaScript from accessing the cookie
		Secure:   isSecure,                // Only send the cookie over HTTPS
		SameSite: http.SameSiteStrictMode, // Prevents CSRF attacks
		MaxAge:   3600,                    // Token expires after 1 hour (adjust as needed)
	})

	utils.WriteJson(w, http.StatusOK, map[string]string{"token": token})
}

func (h *Handler) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// parse and validate JSON payload
	var payload types.RegisterUserPayload
	if !middleware.ValidatePayloadAndRespond(w, r, &payload) {
		return
	}

	// check if the user exists
	_, err := h.store.GetUserByEmail(payload.Email)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("user with email %s already exists", payload.Email))
		return
	}

	err = h.store.ValidatePassword(payload.Password)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	hashedPassword, err := auth.HashPassword(payload.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	// create a new user
	err = h.store.CreateUser(&types.User{
		FirstName: payload.FirstName,
		LastName:  payload.LastName,
		Email:     payload.Email,
		Password:  hashedPassword,
	})

	if err != nil {
		fmt.Println("Error during user creation:", err) // Debugging
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	middleware.WriteCreatedResponse(w)
}
