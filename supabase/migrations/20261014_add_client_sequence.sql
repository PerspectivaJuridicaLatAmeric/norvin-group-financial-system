-- Database-assigned permanent sequential client numbers.
-- Existing clients receive a sequence value; deleted values are not reused.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_sequence bigint GENERATED ALWAYS AS IDENTITY;
CREATE UNIQUE INDEX IF NOT EXISTS clients_client_sequence_unique ON public.clients(client_sequence);
