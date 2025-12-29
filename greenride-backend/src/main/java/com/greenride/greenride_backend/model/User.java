package com.greenride.greenride_backend.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    // email should be unique
    @Column(nullable = false , unique = true)
    private String email;

    @Column(nullable = false)
    private  String password;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name ="user_id" , referencedColumnName = "id") ,
            inverseJoinColumns = @JoinColumn(name = "role_id" , referencedColumnName = "id"))
    private Set<Role>roles= new HashSet<>();
    public User(){}

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() { return id; }

    public void setId(Long id) {this.id = id;}

    public String getName() {return name;}

    public String getEmail() {return email;}

    public void setEmail(String email) { this.email = email;}

    public void setName(String name) {this.name = name;}

    public String getPassword() {return password;}

    public void setPassword(String password) { this.password = password;}

    public Set<Role> getRoles() { return roles;}

    public void setRoles(Set<Role> roles) {this.roles = roles;}
}
