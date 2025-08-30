# app/services/rag_search.py

import os
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest

OPENAI_KEY = os.getenv("OPENAI_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

EMBED_MODEL = "text-embedding-3-large"
_embed_client = OpenAI(api_key=OPENAI_KEY)
_qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def get_context_chunks(user_query: str, assistant_id: int, user_id: int) -> list[str]:
    """Returns top N context chunks from Qdrant for a given assistant-user pair."""
    try:
        query_embedding = _embed_client.embeddings.create(
            input=user_query,
            model=EMBED_MODEL
        ).data[0].embedding

        collection_name = f"assistant_{assistant_id}_user_{user_id}"
        
        # Check if collection exists first
        try:
            collections = _qdrant.get_collections()
            if collection_name not in [c.name for c in collections.collections]:
                print(f"Collection {collection_name} does not exist yet")
                return []
            
            search_results = _qdrant.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=3,
                search_params=rest.SearchParams(hnsw_ef=64),
                with_payload=True,
                with_vectors=False
            )

            contexts = [r.payload["text"] for r in search_results if "text" in r.payload]
            return contexts
            
        except Exception as e:
            print(f"Qdrant search error: {e}")
            return []
    except Exception as e:
        print(f"Error getting context chunks: {e}")
        return []