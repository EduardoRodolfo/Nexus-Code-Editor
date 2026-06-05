<!DOCTYPE html>
<html>
<head>
    <title>Generador de PDF</title>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    <py-config>
        packages = ["pdfkit", "wkhtmltopdf"]
    </py-config>
</head>
<body>
    <h1>Generador de PDF desde HTML</h1>
    
    <textarea id="html-content" rows="10" cols="80">
<!DOCTYPE html>
<html>
<body>
    <h1>Documento Generado</h1>
    <p>Este es un PDF creado con PyScript!</p>
</body>
</html>
    </textarea>
    <br>
    
    <button id="btn-generar">Generar PDF</button>
    
    <py-script>
        import pdfkit
        from js import document, window
        import base64
        
        def generar_pdf(event):
            try:
                # Obtener contenido HTML
                html_content = document.getElementById("html-content").value
                
                # Configurar opciones
                options = {
                    'page-size': 'A4',
                    'margin-top': '0.5in',
                    'margin-right': '0.5in',
                    'margin-bottom': '0.5in',
                    'margin-left': '0.5in',
                }
                
                # Generar PDF
                pdf = pdfkit.from_string(html_content, False, options=options)
                
                # Convertir a base64
                pdf_b64 = base64.b64encode(pdf).decode('utf-8')
                
                # Crear enlace de descarga
                enlace = document.createElement("a")
                enlace.href = f"data:application/pdf;base64,{pdf_b64}"
                enlace.download = "documento.pdf"
                enlace.click()
                
            except Exception as e:
                print(f"Error: {str(e)}")
        
        # Registrar evento
        document.getElementById("btn-generar").addEventListener("click", generar_pdf)
    </py-script>
</body>
</html>