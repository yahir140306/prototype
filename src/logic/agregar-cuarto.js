 // Detectar si es dispositivo móvil
  function isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  }

  // Configuración específica para móviles
  const mobileConfig = {
    maxFileSize: isMobileDevice() ? 2 * 1024 * 1024 : 5 * 1024 * 1024, // 2MB para móvil, 5MB para desktop
    maxWidth: isMobileDevice() ? 1280 : 1920,
    maxHeight: isMobileDevice() ? 720 : 1080,
    quality: isMobileDevice() ? 0.6 : 0.8,
    timeout: isMobileDevice() ? 90000 : 60000, // 90s para móvil
  };

  // Variable para controlar si ya se inicializaron los eventos
  let eventsInitialized = false;

  // Image upload functionality UNIFICADA
  function setupImageUpload(imageNumber) {
    const input = document.getElementById(`imagen_${imageNumber}`);
    const uploadArea = document.getElementById(`upload-area-${imageNumber}`);
    const preview = document.getElementById(`preview-${imageNumber}`);

    if (!input || !uploadArea || !preview) return;

    // Remover cualquier listener previo para evitar duplicados
    const newUploadArea = uploadArea.cloneNode(true);
    const newInput = input.cloneNode(true);

    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    input.parentNode.replaceChild(newInput, input);

    // Click event
    newUploadArea.addEventListener("click", () => newInput.click());

    // Drag and drop functionality
    newUploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      newUploadArea.classList.add("border-indigo-500", "bg-indigo-50");
    });

    newUploadArea.addEventListener("dragleave", () => {
      newUploadArea.classList.remove("border-indigo-500", "bg-indigo-50");
    });

    newUploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      newUploadArea.classList.remove("border-indigo-500", "bg-indigo-50");

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleImageSelect(imageNumber, files[0]);
      }
    });

    newInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageSelect(imageNumber, file);
      }
    });
  }

  // Función unificada para manejar selección de imágenes
  async function handleImageSelect(imageNumber, file) {
    const maxSize = mobileConfig.maxFileSize;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecciona un archivo de imagen válido.", "error");
      return;
    }

    // Validar tamaño inicial
    if (file.size > 10 * 1024 * 1024) {
      // 10MB límite absoluto
      showToast("La imagen es demasiado grande. Máximo 10MB.", "error");
      return;
    }

    // Mostrar progreso para archivos grandes en móvil
    if (file.size > 1024 * 1024 && isMobileDevice()) {
      showToast("Procesando imagen...", "info");
    }

    try {
      // Comprimir imagen si es necesario
      const processedFile = await compressImageIfNeeded(file, maxSize);

      // Actualizar el input con el archivo procesado
      const input = document.getElementById(`imagen_${imageNumber}`);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(processedFile);
      input.files = dataTransfer.files;

      // Mostrar preview
      showImagePreview(imageNumber, processedFile);

      if (processedFile.size < file.size) {
        showToast(
          `Imagen optimizada: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(processedFile.size / 1024 / 1024).toFixed(1)}MB`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error al procesar imagen:", error);
      showToast("Error al procesar la imagen. Intenta con otra.", "error");
    }
  }

  // Función para mostrar preview
  function showImagePreview(imageNumber, file) {
    const uploadArea = document.getElementById(`upload-area-${imageNumber}`);
    const preview = document.getElementById(`preview-${imageNumber}`);
    const img = preview?.querySelector("img");

    if (img) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result;
        uploadArea?.classList.add("hidden");
        preview?.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  }

  // Image compression function mejorada
  async function compressImageIfNeeded(file, maxSize) {
    if (file.size <= maxSize) {
      return file;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxWidth = mobileConfig.maxWidth;
        const maxHeight = mobileConfig.maxHeight;

        const ratio = Math.min(maxWidth / width, maxHeight / height);
        if (ratio < 1) {
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until we get the right size
        let quality = mobileConfig.quality;

        const tryCompress = (q) => {
          canvas.toBlob(
            (blob) => {
              if (blob && (blob.size <= maxSize || q <= 0.3)) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else if (q > 0.3) {
                tryCompress(q - 0.1);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            q
          );
        };

        tryCompress(quality);
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // Remove image function
  function removeImage(imageNumber) {
    const input = document.getElementById(`imagen_${imageNumber}`);
    const uploadArea = document.getElementById(`upload-area-${imageNumber}`);
    const preview = document.getElementById(`preview-${imageNumber}`);

    if (input) input.value = "";
    uploadArea?.classList.remove("hidden");
    preview?.classList.add("hidden");
  }

  // Character counter for description
  function setupDescriptionCounter() {
    const descripcionInput = document.getElementById("descripcion");
    const charCount = document.getElementById("char-count");

    if (!descripcionInput || !charCount) return;

    descripcionInput.addEventListener("input", () => {
      const length = descripcionInput.value.length;
      const maxLength = 500;

      charCount.textContent = `${length} / ${maxLength} caracteres`;

      if (length > maxLength) {
        charCount.classList.add("text-red-500");
        charCount.classList.remove("text-gray-500");
      } else {
        charCount.classList.remove("text-red-500");
        charCount.classList.add("text-gray-500");
      }
    });
  }

  // Toast notification function
  function showToast(message, type = "info") {
    const toastColors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
    };

    const toast = document.createElement("div");
    toast.className = `${toastColors[type]} text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0 max-w-sm`;
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    const container = document.getElementById("toast-container");
    container?.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("translate-x-full", "opacity-0");
    }, 100);

    setTimeout(() => {
      toast.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Form submission mejorado
  async function submitFormData(formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      mobileConfig.timeout
    );

    try {
      if (!navigator.onLine) {
        throw new Error("Sin conexión a internet");
      }

      const response = await fetch("/api/agregar-cuarto", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Form validation and submission
  function setupFormSubmission() {
    const form = document.getElementById("room-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Verificar conectividad
      if (!navigator.onLine) {
        showToast("Sin conexión a internet. Revisa tu conexión.", "error");
        return;
      }

      // Validate required fields
      let hasErrors = false;

      // Validate name
      const nameInput = document.getElementById("name");
      const nameError = document.getElementById("name-error");
      if (!nameInput?.value.trim()) {
        nameError?.classList.remove("hidden");
        hasErrors = true;
      } else {
        nameError?.classList.add("hidden");
      }

      // Validate description
      const descripcionInput = document.getElementById("descripcion");
      const descripcionError = document.getElementById("descripcion-error");
      if (!descripcionInput?.value.trim()) {
        descripcionError?.classList.remove("hidden");
        hasErrors = true;
      } else {
        descripcionError?.classList.add("hidden");
      }

      // Validate price
      const precioInput = document.getElementById("precio");
      const precioError = document.getElementById("precio-error");
      if (!precioInput?.value || parseFloat(precioInput.value) <= 0) {
        precioError?.classList.remove("hidden");
        hasErrors = true;
      } else {
        precioError?.classList.add("hidden");
      }

      if (hasErrors) {
        showToast("Por favor corrige los errores antes de continuar.", "error");
        return;
      }

      // Show loading state
      const submitBtn = document.getElementById("submit-btn");
      const btnText = document.getElementById("btn-text");
      const loadingSpinner = document.getElementById("loading-spinner");

      if (submitBtn) submitBtn.disabled = true;
      if (btnText)
        btnText.textContent = isMobileDevice() ? "Subiendo..." : "Agregando...";
      loadingSpinner?.classList.remove("hidden");

      try {
        const formData = new FormData(form);

        // Log para debug en móvil
        if (isMobileDevice()) {
          console.log("Enviando desde dispositivo móvil");
          for (let [key, value] of formData.entries()) {
            if (value instanceof File && value.size > 0) {
              console.log(`${key}: ${(value.size / 1024 / 1024).toFixed(2)}MB`);
            }
          }
        }

        const result = await submitFormData(formData);

        if (result.success) {
          showToast("¡Cuarto agregado exitosamente!", "success");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        } else {
          showToast(result.error || "Error al agregar el cuarto.", "error");
        }
      } catch (error) {
        console.error("Error al enviar formulario:", error);

        let errorMessage = "Error de conexión.";

        if (error.name === "AbortError") {
          errorMessage =
            "La subida tardó demasiado. Intenta con imágenes más pequeñas.";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Error de red. Verifica tu conexión.";
        } else if (
          error.message.includes("413") ||
          error.message.includes("too large")
        ) {
          errorMessage =
            "Archivos muy grandes. Reduce el tamaño de las imágenes.";
        }

        showToast(errorMessage, "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = "Agregar Cuarto";
        loadingSpinner?.classList.add("hidden");
      }
    });
  }

  // Connectivity monitoring
  function setupConnectivityMonitoring() {
    window.addEventListener("online", () => {
      showToast("Conexión restaurada", "success");
    });

    window.addEventListener("offline", () => {
      showToast("Sin conexión a internet", "error");
    });
  }

  // Initialize everything
  function initializeForm() {
    if (eventsInitialized) return;
    eventsInitialized = true;

    console.log(
      isMobileDevice()
        ? "Inicializando con optimizaciones móviles"
        : "Inicializando versión desktop"
    );

    // Setup image uploads
    [1, 2, 3].forEach((num) => setupImageUpload(num));

    // Setup description counter
    setupDescriptionCounter();

    // Setup form submission
    setupFormSubmission();

    // Setup connectivity monitoring if mobile
    if (isMobileDevice()) {
      setupConnectivityMonitoring();
      showToast("Optimizaciones móviles activadas", "info");
    }
  }

  // Make removeImage function global
  window.removeImage = removeImage;

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeForm);
  } else {
    initializeForm();
  }
