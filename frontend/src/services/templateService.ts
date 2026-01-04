import { Template, TemplateCreate } from "../types/template";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

class TemplateService {
  private baseUrl = API_BASE + "/templates";

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async list(): Promise<Template[]> {
    const res = await fetch(this.baseUrl, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch templates");
    return res.json();
  }

  async get(id: number): Promise<Template> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch template");
    return res.json();
  }

  async create(data: Partial<TemplateCreate>): Promise<Template> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create template");
    return res.json();
  }

  async update(id: number, data: Partial<TemplateCreate>): Promise<Template> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update template");
    return res.json();
  }
}

export const templateService = new TemplateService();
