
-- Esquema de base de datos para la aplicación ChatApp

-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'active', 'pending', 'blocked'
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de chats
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Nueva conversación',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Crear usuario administrador por defecto (la contraseña debe ser hasheada en la aplicación)
-- Nota: Este usuario se debe crear desde la aplicación usando la API de autenticación de Supabase
-- Este es solo un ejemplo para mostrar cómo sería la inserción de datos
INSERT INTO users (id, username, email, status, is_admin, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- ID que se obtendrá de Supabase Auth
    'admin',
    'admin@example.com',
    'active',
    TRUE,
    NOW()
);

-- Funciones para gestionar fechas de actualización automáticamente
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar la fecha de la última modificación en los chats
CREATE TRIGGER update_chats_last_updated
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_column();

-- Políticas de seguridad de nivel de fila (RLS) para Supabase
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para usuarios: solo pueden ver y modificar su propio perfil, los administradores pueden ver todos
CREATE POLICY users_policy ON users
    USING (id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- Política para que los administradores puedan modificar cualquier usuario
CREATE POLICY admin_users_policy ON users
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- Política para chats: los usuarios solo pueden ver sus propios chats
CREATE POLICY chats_policy ON chats
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- Política para mensajes: los usuarios solo pueden ver mensajes de sus propios chats
CREATE POLICY messages_policy ON messages
    USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = chat_id 
            AND (chats.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE))
        )
    );
